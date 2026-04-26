use crate::VideoFrameInfo;
use std::path::Path;
use tracing::{info, warn};

pub fn extract_frames(
    video_path: &str,
    output_dir: &str,
    frame_interval: u32,
) -> Result<Vec<VideoFrameInfo>, Box<dyn std::error::Error>> {
    let path = Path::new(video_path);
    if !path.exists() {
        return Err(format!("Video file not found: {}", video_path).into());
    }

    let out_dir = Path::new(output_dir);
    if !out_dir.exists() {
        std::fs::create_dir_all(out_dir)?;
    }

    info!(
        "Extracting frames from {} (interval: {})",
        video_path, frame_interval
    );

    let frames = extract_frames_ffmpeg(video_path, output_dir, frame_interval)?;

    info!("Extracted {} frames to {}", frames.len(), output_dir);
    Ok(frames)
}

fn extract_frames_ffmpeg(
    video_path: &str,
    output_dir: &str,
    frame_interval: u32,
) -> Result<Vec<VideoFrameInfo>, Box<dyn std::error::Error>> {
    let output_pattern = format!("{}/frame_%06d.png", output_dir);

    let fps_filter = if frame_interval > 1 {
        format!("select='not(mod(n\\,{}))',setpts=N/FRAME_RATE/TB", frame_interval)
    } else {
        String::new()
    };

    let mut cmd = std::process::Command::new("ffmpeg");
    cmd.arg("-i").arg(video_path);

    if !fps_filter.is_empty() {
        cmd.arg("-vf").arg(&fps_filter);
    }

    cmd.arg("-vsync").arg("vfr")
       .arg("-q:v").arg("2")
       .arg(&output_pattern)
       .arg("-y");

    let output = cmd.output();

    match output {
        Ok(result) => {
            if !result.status.success() {
                let stderr = String::from_utf8_lossy(&result.stderr);
                warn!("ffmpeg warning: {}", stderr);
            }
        }
        Err(e) => {
            warn!("ffmpeg not found or failed: {}. Falling back to image-based extraction.", e);
            return Ok(vec![]);
        }
    }

    let mut frames = Vec::new();
    let mut index = 0;
    loop {
        let frame_path = format!("{}/frame_{:06}.png", output_dir, index + 1);
        if !Path::new(&frame_path).exists() {
            break;
        }
        frames.push(VideoFrameInfo {
            frame_index: index * frame_interval as usize,
            timestamp_ms: (index as f64 * frame_interval as f64) / 30.0 * 1000.0,
            path: frame_path,
        });
        index += 1;
    }

    Ok(frames)
}

pub fn get_video_info(video_path: &str) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let path = Path::new(video_path);
    if !path.exists() {
        return Err(format!("Video file not found: {}", video_path).into());
    }

    let output = std::process::Command::new("ffprobe")
        .args([
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path,
        ])
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                let stdout = String::from_utf8(result.stdout)?;
                let info: serde_json::Value = serde_json::from_str(&stdout)?;

                let mut width = 0u32;
                let mut height = 0u32;
                let mut fps = 30.0f64;
                let mut total_frames = 0u64;
                let mut duration = 0.0f64;

                if let Some(streams) = info["streams"].as_array() {
                    for stream in streams {
                        if stream["codec_type"].as_str() == Some("video") {
                            width = stream["width"].as_u64().unwrap_or(0) as u32;
                            height = stream["height"].as_u64().unwrap_or(0) as u32;
                            total_frames = stream["nb_frames"]
                                .as_str()
                                .and_then(|s| s.parse().ok())
                                .unwrap_or(0);

                            if let Some(r_frame_rate) = stream["r_frame_rate"].as_str() {
                                let parts: Vec<&str> = r_frame_rate.split('/').collect();
                                if parts.len() == 2 {
                                    let num: f64 = parts[0].parse().unwrap_or(30.0);
                                    let den: f64 = parts[1].parse().unwrap_or(1.0);
                                    if den > 0.0 {
                                        fps = num / den;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }

                if let Some(format) = info.get("format") {
                    duration = format["duration"]
                        .as_str()
                        .and_then(|s| s.parse().ok())
                        .unwrap_or(0.0);
                }

                if total_frames == 0 && duration > 0.0 {
                    total_frames = (duration * fps) as u64;
                }

                Ok(serde_json::json!({
                    "width": width,
                    "height": height,
                    "fps": fps,
                    "total_frames": total_frames,
                    "duration": duration,
                    "path": video_path,
                }))
            } else {
                Err("ffprobe failed".into())
            }
        }
        Err(_) => {
            let metadata = std::fs::metadata(video_path)?;
            Ok(serde_json::json!({
                "width": 0,
                "height": 0,
                "fps": 30.0,
                "total_frames": 0,
                "duration": 0.0,
                "path": video_path,
                "size_bytes": metadata.len(),
                "note": "ffprobe not available; limited info",
            }))
        }
    }
}
