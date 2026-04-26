mod ai;
mod imaging;
mod video;
mod export;

use serde::{Deserialize, Serialize};
use tracing::info;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

// ======================== Data Types ========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
    pub label: String,
    pub confidence: f64,
    pub bbox: BBox,
    pub points: Vec<Point>,
    #[serde(rename = "type")]
    pub detection_type: String,
    pub mask: Option<Vec<Vec<u8>>>,
    pub text: Option<String>,
    pub track_id: Option<i32>,
    pub keypoints: Option<Vec<Point>>,
    pub keypoint_scores: Option<Vec<f64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub model_type: String,
    pub task: String,
    pub backend: String,
    pub loaded: bool,
    pub classes: Vec<String>,
    pub input_size: Option<(u32, u32)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub image_path: String,
    pub model_name: String,
    pub confidence_threshold: Option<f64>,
    pub nms_threshold: Option<f64>,
    pub prompt: Option<String>,
    pub points: Option<Vec<Point>>,
    pub point_labels: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    pub detections: Vec<Detection>,
    pub inference_time_ms: f64,
    pub model_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFrameInfo {
    pub frame_index: usize,
    pub timestamp_ms: f64,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageProcessResult {
    pub width: u32,
    pub height: u32,
    pub data_url: String,
}

// ======================== Tauri Commands ========================

#[tauri::command]
fn greet(name: &str) -> String {
    info!("greet called with name: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_image_info(path: String) -> Result<serde_json::Value, String> {
    imaging::get_image_info(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn resize_image(path: String, width: u32, height: u32) -> Result<String, String> {
    imaging::resize_image(&path, width, height).map_err(|e| e.to_string())
}

#[tauri::command]
async fn generate_thumbnail(path: String, max_size: u32) -> Result<String, String> {
    imaging::generate_thumbnail(&path, max_size).map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_visualization(
    image_path: String,
    annotations_json: String,
    output_path: String,
    show_labels: bool,
) -> Result<(), String> {
    export::export_visualization(&image_path, &annotations_json, &output_path, show_labels)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn generate_mask_image(
    annotations_json: String,
    width: u32,
    height: u32,
    output_path: String,
) -> Result<(), String> {
    export::generate_mask_image(&annotations_json, width, height, &output_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn extract_video_frames(
    video_path: String,
    output_dir: String,
    frame_interval: Option<u32>,
) -> Result<Vec<VideoFrameInfo>, String> {
    video::extract_frames(&video_path, &output_dir, frame_interval.unwrap_or(1))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_video_info(video_path: String) -> Result<serde_json::Value, String> {
    video::get_video_info(&video_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_available_models(models_dir: String) -> Result<Vec<ModelInfo>, String> {
    ai::list_models(&models_dir).map_err(|e| e.to_string())
}

#[tauri::command]
async fn run_inference(request: InferenceRequest) -> Result<InferenceResult, String> {
    ai::run_inference(request).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn run_remote_inference(
    server_url: String,
    request: InferenceRequest,
) -> Result<InferenceResult, String> {
    ai::run_remote_inference(&server_url, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn batch_inference(
    image_paths: Vec<String>,
    model_name: String,
    confidence_threshold: Option<f64>,
) -> Result<Vec<InferenceResult>, String> {
    ai::batch_inference(image_paths, &model_name, confidence_threshold.unwrap_or(0.5))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_annotations_batch(
    image_dir: String,
    output_dir: String,
    format: String,
) -> Result<u32, String> {
    export::export_batch(&image_dir, &output_dir, &format)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn compute_image_hash(path: String) -> Result<String, String> {
    imaging::compute_hash(&path).map_err(|e| e.to_string())
}

// ======================== App Entry ========================

fn init_logging() {
    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,rlabel=debug"));

    let appender = tracing_appender::rolling::never(".", "rlabel.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(appender);

    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt::layer().with_writer(std::io::stdout).with_ansi(true))
        .with(fmt::layer().with_writer(non_blocking).with_ansi(false))
        .init();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_logging();
    info!("Starting RLabel v0.2.0");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_image_info,
            resize_image,
            generate_thumbnail,
            export_visualization,
            generate_mask_image,
            extract_video_frames,
            get_video_info,
            list_available_models,
            run_inference,
            run_remote_inference,
            batch_inference,
            export_annotations_batch,
            compute_image_hash,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
