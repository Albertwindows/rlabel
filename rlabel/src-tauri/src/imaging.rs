use image::{DynamicImage, GenericImageView, ImageFormat, imageops::FilterType};
use base64::{engine::general_purpose::STANDARD, Engine};
use std::io::Cursor;

pub fn get_image_info(path: &str) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let img = image::open(path)?;
    let (width, height) = img.dimensions();
    let color_type = format!("{:?}", img.color());

    Ok(serde_json::json!({
        "width": width,
        "height": height,
        "color_type": color_type,
        "path": path,
    }))
}

pub fn resize_image(path: &str, width: u32, height: u32) -> Result<String, Box<dyn std::error::Error>> {
    let img = image::open(path)?;
    let resized = img.resize_exact(width, height, FilterType::Lanczos3);
    image_to_data_url(&resized)
}

pub fn generate_thumbnail(path: &str, max_size: u32) -> Result<String, Box<dyn std::error::Error>> {
    let img = image::open(path)?;
    let thumb = img.thumbnail(max_size, max_size);
    image_to_data_url(&thumb)
}

pub fn compute_hash(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    use std::fs;
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let data = fs::read(path)?;
    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    Ok(format!("{:016x}", hasher.finish()))
}

fn image_to_data_url(img: &DynamicImage) -> Result<String, Box<dyn std::error::Error>> {
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, ImageFormat::Png)?;
    let encoded = STANDARD.encode(buf.into_inner());
    Ok(format!("data:image/png;base64,{}", encoded))
}

#[allow(dead_code)]
pub fn load_image_rgba(path: &str) -> Result<(Vec<u8>, u32, u32), Box<dyn std::error::Error>> {
    let img = image::open(path)?;
    let rgba = img.to_rgba8();
    let (w, h) = rgba.dimensions();
    Ok((rgba.into_raw(), w, h))
}

#[allow(dead_code)]
pub fn preprocess_for_model(
    path: &str,
    target_width: u32,
    target_height: u32,
) -> Result<(Vec<f32>, u32, u32, f32, f32), Box<dyn std::error::Error>> {
    let img = image::open(path)?;
    let (orig_w, orig_h) = img.dimensions();

    let resized = img.resize_exact(target_width, target_height, FilterType::Lanczos3);
    let rgb = resized.to_rgb8();

    let mut tensor = vec![0.0f32; (3 * target_width * target_height) as usize];
    let pixels = rgb.as_raw();

    for y in 0..target_height {
        for x in 0..target_width {
            let idx = ((y * target_width + x) * 3) as usize;
            let r = pixels[idx] as f32 / 255.0;
            let g = pixels[idx + 1] as f32 / 255.0;
            let b = pixels[idx + 2] as f32 / 255.0;

            let offset = (target_width * target_height) as usize;
            tensor[(y * target_width + x) as usize] = r;
            tensor[offset + (y * target_width + x) as usize] = g;
            tensor[2 * offset + (y * target_width + x) as usize] = b;
        }
    }

    let scale_x = orig_w as f32 / target_width as f32;
    let scale_y = orig_h as f32 / target_height as f32;

    Ok((tensor, orig_w, orig_h, scale_x, scale_y))
}
