use image::{Rgba, RgbaImage};
use imageproc::drawing::{draw_hollow_rect_mut, draw_line_segment_mut};
use imageproc::rect::Rect;
use std::path::Path;
use tracing::info;

pub fn export_visualization(
    image_path: &str,
    annotations_json: &str,
    output_path: &str,
    show_labels: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let img = image::open(image_path)?;
    let mut rgba_img = img.to_rgba8();
    let (img_w, img_h) = (rgba_img.width(), rgba_img.height());
    let annotations: Vec<serde_json::Value> = serde_json::from_str(annotations_json)?;

    for ann in &annotations {
        let color_str = ann["color"].as_str().unwrap_or("#ff0000");
        let rgba = parse_hex_color(color_str);
        let label = ann["label"].as_str().unwrap_or("unknown");
        let ann_type = ann["type"].as_str().unwrap_or("rectangle");

        if let Some(points) = ann["points"].as_array() {
            let pts: Vec<(f32, f32)> = points
                .iter()
                .filter_map(|p| {
                    let x = p["x"].as_f64()? as f32;
                    let y = p["y"].as_f64()? as f32;
                    Some((x, y))
                })
                .collect();

            if pts.is_empty() {
                continue;
            }

            match ann_type {
                "rectangle" | "rotatedRect" | "quadrilateral" | "text" => {
                    if pts.len() >= 4 {
                        for i in 0..pts.len() {
                            let j = (i + 1) % pts.len();
                            draw_line_segment_mut(&mut rgba_img, pts[i], pts[j], rgba);
                        }
                    } else if pts.len() >= 2 {
                        let min_x = pts.iter().map(|p| p.0).fold(f32::INFINITY, f32::min) as i32;
                        let min_y = pts.iter().map(|p| p.1).fold(f32::INFINITY, f32::min) as i32;
                        let max_x = pts.iter().map(|p| p.0).fold(f32::NEG_INFINITY, f32::max) as i32;
                        let max_y = pts.iter().map(|p| p.1).fold(f32::NEG_INFINITY, f32::max) as i32;
                        if max_x > min_x && max_y > min_y {
                            draw_hollow_rect_mut(
                                &mut rgba_img,
                                Rect::at(min_x, min_y)
                                    .of_size((max_x - min_x) as u32, (max_y - min_y) as u32),
                                rgba,
                            );
                        }
                    }
                }
                "polygon" | "mask" => {
                    for i in 0..pts.len() {
                        let j = (i + 1) % pts.len();
                        draw_line_segment_mut(&mut rgba_img, pts[i], pts[j], rgba);
                    }
                }
                "line" => {
                    if pts.len() >= 2 {
                        draw_line_segment_mut(&mut rgba_img, pts[0], pts[1], rgba);
                    }
                }
                "linestrip" => {
                    for i in 0..pts.len().saturating_sub(1) {
                        draw_line_segment_mut(&mut rgba_img, pts[i], pts[i + 1], rgba);
                    }
                }
                "point" => {
                    let (x, y) = pts[0];
                    let r = 3i32;
                    for dy in -r..=r {
                        for dx in -r..=r {
                            if dx * dx + dy * dy <= r * r {
                                let px = x as i32 + dx;
                                let py = y as i32 + dy;
                                if px >= 0 && py >= 0 && (px as u32) < img_w && (py as u32) < img_h {
                                    rgba_img.put_pixel(px as u32, py as u32, rgba);
                                }
                            }
                        }
                    }
                }
                "circle" => {
                    if !pts.is_empty() {
                        let center = pts[0];
                        let radius = if pts.len() >= 2 {
                            ((pts[1].0 - center.0).powi(2) + (pts[1].1 - center.1).powi(2)).sqrt()
                        } else {
                            ann["radius"].as_f64().unwrap_or(10.0) as f32
                        };
                        let steps = (radius * 6.28).max(36.0) as usize;
                        for i in 0..steps {
                            let a1 = (i as f32 / steps as f32) * std::f32::consts::TAU;
                            let a2 = ((i + 1) as f32 / steps as f32) * std::f32::consts::TAU;
                            draw_line_segment_mut(
                                &mut rgba_img,
                                (center.0 + radius * a1.cos(), center.1 + radius * a1.sin()),
                                (center.0 + radius * a2.cos(), center.1 + radius * a2.sin()),
                                rgba,
                            );
                        }
                    }
                }
                "cuboid" => {
                    if pts.len() >= 8 {
                        for i in 0..4 {
                            let j = (i + 1) % 4;
                            draw_line_segment_mut(&mut rgba_img, pts[i], pts[j], rgba);
                            draw_line_segment_mut(&mut rgba_img, pts[i + 4], pts[j + 4], rgba);
                            draw_line_segment_mut(&mut rgba_img, pts[i], pts[i + 4], rgba);
                        }
                    }
                }
                _ => {}
            }

            if show_labels && !pts.is_empty() {
                let (lx, ly) = pts[0];
                let label_y = (ly - 12.0).max(0.0) as u32;
                let text_len = label.len() as u32 * 7;
                if lx as u32 + text_len < img_w && label_y < img_h {
                    for dx in 0..text_len {
                        for dy in 0..12u32 {
                            let px = lx as u32 + dx;
                            let py = label_y + dy;
                            if px < img_w && py < img_h {
                                rgba_img.put_pixel(px, py, Rgba([rgba[0], rgba[1], rgba[2], 180]));
                            }
                        }
                    }
                }
            }
        }
    }

    rgba_img.save(output_path)?;
    info!("Exported visualization to {}", output_path);
    Ok(())
}

pub fn generate_mask_image(
    annotations_json: &str,
    width: u32,
    height: u32,
    output_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut mask = RgbaImage::new(width, height);
    let annotations: Vec<serde_json::Value> = serde_json::from_str(annotations_json)?;

    let mut class_colors: std::collections::HashMap<String, u8> = std::collections::HashMap::new();
    let mut next_id: u8 = 1;

    for ann in &annotations {
        let label = ann["label"].as_str().unwrap_or("unknown").to_string();
        let class_id = *class_colors.entry(label).or_insert_with(|| {
            let id = next_id;
            next_id = next_id.wrapping_add(1);
            id
        });

        if let Some(points) = ann["points"].as_array() {
            let pts: Vec<(f64, f64)> = points
                .iter()
                .filter_map(|p| {
                    let x = p["x"].as_f64()?;
                    let y = p["y"].as_f64()?;
                    Some((x, y))
                })
                .collect();

            if pts.len() >= 3 {
                fill_polygon_on_mask(&mut mask, &pts, class_id, width, height);
            }
        }
    }

    mask.save(output_path)?;
    info!("Generated mask image at {}", output_path);
    Ok(())
}

fn fill_polygon_on_mask(
    mask: &mut RgbaImage,
    points: &[(f64, f64)],
    class_id: u8,
    width: u32,
    height: u32,
) {
    let min_y = points.iter().map(|p| p.1).fold(f64::INFINITY, f64::min).max(0.0) as u32;
    let max_y = points
        .iter()
        .map(|p| p.1)
        .fold(f64::NEG_INFINITY, f64::max)
        .min(height as f64 - 1.0) as u32;

    for y in min_y..=max_y {
        let mut intersections = Vec::new();
        let n = points.len();
        for i in 0..n {
            let j = (i + 1) % n;
            let (y0, y1) = (points[i].1, points[j].1);
            let (x0, x1) = (points[i].0, points[j].0);
            if (y0 <= y as f64 && y1 > y as f64) || (y1 <= y as f64 && y0 > y as f64) {
                let t = (y as f64 - y0) / (y1 - y0);
                let x = x0 + t * (x1 - x0);
                intersections.push(x);
            }
        }
        intersections.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        for pair in intersections.chunks(2) {
            if pair.len() == 2 {
                let x_start = pair[0].max(0.0) as u32;
                let x_end = pair[1].min(width as f64 - 1.0) as u32;
                for x in x_start..=x_end {
                    mask.put_pixel(x, y, Rgba([class_id, class_id, class_id, 255]));
                }
            }
        }
    }
}

pub fn export_batch(
    image_dir: &str,
    output_dir: &str,
    format: &str,
) -> Result<u32, Box<dyn std::error::Error>> {
    let dir = Path::new(image_dir);
    let out = Path::new(output_dir);
    if !out.exists() {
        std::fs::create_dir_all(out)?;
    }

    let image_extensions = ["jpg", "jpeg", "png", "bmp", "gif", "webp", "tiff", "tif"];
    let mut count = 0u32;

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if image_extensions.contains(&ext.to_lowercase().as_str()) {
                let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("unknown");
                let ann_path = dir.join(format!("{}_annotations.json", stem));
                let ann_path2 = dir.join(format!("{}.json", stem));
                let target = if ann_path.exists() {
                    Some(ann_path)
                } else if ann_path2.exists() {
                    Some(ann_path2)
                } else {
                    None
                };
                if let Some(json_path) = target {
                    let content = std::fs::read_to_string(&json_path)?;
                    let out_ext = match format {
                        "yolo" | "dota" | "mot" | "ppocr" => "txt",
                        "voc" => "xml",
                        "mask" => "png",
                        _ => "json",
                    };
                    let out_file = out.join(format!("{}.{}", stem, out_ext));
                    if format == "mask" {
                        let data: serde_json::Value = serde_json::from_str(&content)?;
                        let w = data["width"].as_u64().unwrap_or(640) as u32;
                        let h = data["height"].as_u64().unwrap_or(480) as u32;
                        let anns = data["annotations"].to_string();
                        generate_mask_image(&anns, w, h, out_file.to_str().unwrap())?;
                    } else {
                        std::fs::copy(&json_path, &out_file)?;
                    }
                    count += 1;
                }
            }
        }
    }

    info!("Batch exported {} annotations to {}", count, output_dir);
    Ok(count)
}

fn parse_hex_color(hex: &str) -> Rgba<u8> {
    let hex = hex.trim_start_matches('#');
    if hex.len() >= 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
        Rgba([r, g, b, 255])
    } else {
        Rgba([255, 0, 0, 255])
    }
}
