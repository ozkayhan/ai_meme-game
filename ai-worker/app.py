import gradio as gr
import insightface
from insightface.app import FaceAnalysis
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import os

# Initialize InsightFace
# Note: On HF Spaces, we might need to download models manually or use a pre-built docker image.
# For this code, we assume models are available or will be downloaded automatically.
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0, det_size=(640, 640))
swapper = insightface.model_zoo.get_model('inswapper_128.onnx', download=True, download_zip=True)

def download_image(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def swap_face(source_img_url, target_img_url, caption_text):
    try:
        # 1. Download images
        source_img = download_image(source_img_url)
        target_img = download_image(target_img_url)

        # 2. Face Swap
        source_faces = app.get(source_img)
        target_faces = app.get(target_img)

        if not source_faces:
            return None # No face found in source
        
        source_face = source_faces[0]
        
        # Swap all faces in target or just the first one?
        # Usually for memes we want to swap the main face.
        res = target_img.copy()
        
        for target_face in target_faces:
            res = swapper.get(res, target_face, source_face, paste_back=True)

        # Convert back to PIL for captioning
        res_pil = Image.fromarray(cv2.cvtColor(res, cv2.COLOR_BGR2RGB))

        # 3. Add Caption
        if caption_text:
            draw = ImageDraw.Draw(res_pil)
            # Load font (default or custom if available)
            try:
                font = ImageFont.truetype("arial.ttf", 40)
            except:
                font = ImageFont.load_default()
            
            # Simple caption logic: White text with black border at the bottom
            # Or "White strip with black text" as per TDD
            
            # TDD: "resmin altına beyaz şerit üzerine siyah fontla yaz"
            w, h = res_pil.size
            strip_height = 100
            new_img = Image.new("RGB", (w, h + strip_height), "white")
            new_img.paste(res_pil, (0, 0))
            
            draw = ImageDraw.Draw(new_img)
            
            # Calculate text size to center it
            # This is a simplified text centering
            text_w = draw.textlength(caption_text, font=font)
            text_x = (w - text_w) / 2
            text_y = h + (strip_height - 40) / 2 # Approx vertical center
            
            draw.text((text_x, text_y), caption_text, fill="black", font=font)
            res_pil = new_img

        # 4. Save to temp path
        output_path = "output.jpg"
        res_pil.save(output_path)
        return output_path

    except Exception as e:
        print(f"Error: {e}")
        return None

# Gradio Interface
iface = gr.Interface(
    fn=swap_face,
    inputs=[
        gr.Text(label="Source Image URL"),
        gr.Text(label="Target Image URL"),
        gr.Text(label="Caption")
    ],
    outputs=gr.Image(type="filepath"),
    title="AI Meme Worker"
)

if __name__ == "__main__":
    iface.launch()
