import insightface
from insightface.app import FaceAnalysis
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import base64
from io import BytesIO
import os

# Initialize InsightFace
# Note: This will download models to ~/.insightface on first run
# We use a try-except block to handle potential initialization errors (e.g. memory)
try:
    app = FaceAnalysis(name='buffalo_l')
    app.prepare(ctx_id=0, det_size=(640, 640))
    swapper = insightface.model_zoo.get_model('inswapper_128.onnx', download=True, download_zip=True)
    print("AI Models Loaded Successfully")
except Exception as e:
    print(f"AI Model Load Error: {e}")
    app = None
    swapper = None

def base64_to_cv2(b64str):
    if "," in b64str:
        b64str = b64str.split(",")[1]
    img_data = base64.b64decode(b64str)
    img = Image.open(BytesIO(img_data))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def cv2_to_base64(img_cv2):
    img_pil = Image.fromarray(cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB))
    buff = BytesIO()
    img_pil.save(buff, format="JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buff.getvalue()).decode("utf-8")

def download_image_to_cv2(url):
    import requests
    resp = requests.get(url)
    img = Image.open(BytesIO(resp.content))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def swap_face_base64(source_b64, target_url, caption_text):
    if not app or not swapper:
        print("AI Models not loaded. Returning mock.")
        return None

    try:
        # 1. Load Images
        source_img = base64_to_cv2(source_b64)
        target_img = download_image_to_cv2(target_url)

        # 2. Face Swap
        source_faces = app.get(source_img)
        target_faces = app.get(target_img)

        if not source_faces:
            print("No source face found")
            return None
        
        source_face = source_faces[0]
        res = target_img.copy()
        
        for target_face in target_faces:
            res = swapper.get(res, target_face, source_face, paste_back=True)

        # 3. Add Caption
        res_pil = Image.fromarray(cv2.cvtColor(res, cv2.COLOR_BGR2RGB))
        
        if caption_text:
            # Simple caption logic
            w, h = res_pil.size
            strip_height = int(h * 0.15) # 15% of height
            new_img = Image.new("RGB", (w, h + strip_height), "white")
            new_img.paste(res_pil, (0, 0))
            
            draw = ImageDraw.Draw(new_img)
            try:
                # Try to load a font, fallback to default
                font_size = int(strip_height * 0.6)
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            # Center text
            text_bbox = draw.textbbox((0, 0), caption_text, font=font)
            text_w = text_bbox[2] - text_bbox[0]
            text_h = text_bbox[3] - text_bbox[1]
            
            text_x = (w - text_w) / 2
            text_y = h + (strip_height - text_h) / 2
            
            draw.text((text_x, text_y), caption_text, fill="black", font=font)
            res_pil = new_img

        # 4. Return Base64
        return cv2_to_base64(np.array(res_pil))

    except Exception as e:
        print(f"Face Swap Error: {e}")
        return None
