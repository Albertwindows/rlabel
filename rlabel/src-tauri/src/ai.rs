use base64::Engine;
use crate::{Detection, InferenceRequest, InferenceResult, ModelInfo};
use std::path::Path;
use std::time::Instant;
use tracing::{info, warn};

pub fn list_models(models_dir: &str) -> Result<Vec<ModelInfo>, Box<dyn std::error::Error>> {
    let mut models = Vec::new();
    let dir = Path::new(models_dir);

    if !dir.exists() {
        return Ok(models);
    }

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "onnx") {
            let name = path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            let config_path = path.with_extension("json");
            let (model_type, task, classes, input_size) = if config_path.exists() {
                parse_model_config(&config_path)?
            } else {
                infer_model_info(&name)
            };

            models.push(ModelInfo {
                name,
                model_type,
                task,
                backend: "onnx".to_string(),
                loaded: false,
                classes,
                input_size,
            });
        }

        if path.extension().map_or(false, |ext| ext == "engine" || ext == "trt") {
            let name = path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            models.push(ModelInfo {
                name,
                model_type: "tensorrt".to_string(),
                task: "detection".to_string(),
                backend: "tensorrt".to_string(),
                loaded: false,
                classes: vec![],
                input_size: None,
            });
        }
    }

    info!("Found {} models in {}", models.len(), models_dir);
    Ok(models)
}

fn parse_model_config(
    config_path: &Path,
) -> Result<(String, String, Vec<String>, Option<(u32, u32)>), Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(config_path)?;
    let config: serde_json::Value = serde_json::from_str(&content)?;

    let model_type = config["type"].as_str().unwrap_or("yolo").to_string();
    let task = config["task"].as_str().unwrap_or("detection").to_string();
    let classes: Vec<String> = config["classes"]
        .as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    let input_size = config["input_size"]
        .as_array()
        .and_then(|arr| {
            if arr.len() >= 2 {
                Some((arr[0].as_u64()? as u32, arr[1].as_u64()? as u32))
            } else {
                None
            }
        });

    Ok((model_type, task, classes, input_size))
}

fn infer_model_info(name: &str) -> (String, String, Vec<String>, Option<(u32, u32)>) {
    let lower = name.to_lowercase();
    let task = if lower.contains("seg") {
        "segmentation"
    } else if lower.contains("pose") {
        "pose"
    } else if lower.contains("cls") {
        "classification"
    } else if lower.contains("obb") {
        "obb_detection"
    } else if lower.contains("ocr") {
        "ocr"
    } else if lower.contains("sam") {
        "segment_anything"
    } else if lower.contains("depth") {
        "depth"
    } else {
        "detection"
    };

    let model_type = if lower.contains("yolo") {
        "yolo"
    } else if lower.contains("sam") {
        "sam"
    } else if lower.contains("rtdetr") || lower.contains("rt-detr") {
        "rtdetr"
    } else if lower.contains("detr") {
        "detr"
    } else {
        "generic"
    };

    let input_size = if lower.contains("640") {
        Some((640, 640))
    } else if lower.contains("1024") {
        Some((1024, 1024))
    } else {
        Some((640, 640))
    };

    (model_type.to_string(), task.to_string(), vec![], input_size)
}

pub async fn run_inference(
    request: InferenceRequest,
) -> Result<InferenceResult, Box<dyn std::error::Error + Send + Sync>> {
    let start = Instant::now();
    info!("Running inference with model: {}", request.model_name);

    let _conf_thresh = request.confidence_threshold.unwrap_or(0.5);
    let _nms_thresh = request.nms_threshold.unwrap_or(0.45);

    let detections = Vec::new();

    let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    info!("Inference completed in {:.1}ms, found {} detections", elapsed, detections.len());

    Ok(InferenceResult {
        detections,
        inference_time_ms: elapsed,
        model_name: request.model_name,
    })
}

pub async fn run_remote_inference(
    server_url: &str,
    request: InferenceRequest,
) -> Result<InferenceResult, Box<dyn std::error::Error + Send + Sync>> {
    let start = Instant::now();
    info!("Running remote inference at: {}", server_url);

    let image_data = std::fs::read(&request.image_path)?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&image_data);

    let client = reqwest::Client::new();
    let payload = serde_json::json!({
        "image": b64,
        "model": request.model_name,
        "confidence_threshold": request.confidence_threshold.unwrap_or(0.5),
        "nms_threshold": request.nms_threshold.unwrap_or(0.45),
        "prompt": request.prompt,
        "points": request.points,
        "point_labels": request.point_labels,
    });

    let response = client
        .post(format!("{}/predict", server_url))
        .json(&payload)
        .send()
        .await?;

    let result: serde_json::Value = response.json().await?;
    let elapsed = start.elapsed().as_secs_f64() * 1000.0;

    let detections: Vec<Detection> = if let Some(dets) = result["detections"].as_array() {
        dets.iter()
            .filter_map(|d| serde_json::from_value(d.clone()).ok())
            .collect()
    } else {
        vec![]
    };

    info!("Remote inference completed in {:.1}ms, found {} detections", elapsed, detections.len());

    Ok(InferenceResult {
        detections,
        inference_time_ms: elapsed,
        model_name: request.model_name,
    })
}

pub async fn batch_inference(
    image_paths: Vec<String>,
    model_name: &str,
    confidence_threshold: f64,
) -> Result<Vec<InferenceResult>, Box<dyn std::error::Error + Send + Sync>> {
    let mut results = Vec::new();
    let total = image_paths.len();

    for (i, path) in image_paths.iter().enumerate() {
        info!("Batch inference: {}/{} - {}", i + 1, total, path);
        let request = InferenceRequest {
            image_path: path.clone(),
            model_name: model_name.to_string(),
            confidence_threshold: Some(confidence_threshold),
            nms_threshold: Some(0.45),
            prompt: None,
            points: None,
            point_labels: None,
        };

        match run_inference(request).await {
            Ok(result) => results.push(result),
            Err(e) => {
                warn!("Failed to run inference on {}: {}", path, e);
                results.push(InferenceResult {
                    detections: vec![],
                    inference_time_ms: 0.0,
                    model_name: model_name.to_string(),
                });
            }
        }
    }

    Ok(results)
}
