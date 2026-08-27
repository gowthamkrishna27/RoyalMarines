from PIL import Image, ImageEnhance

def process_logo(in_path, out_path):
    try:
        img = Image.open(in_path).convert("RGBA")
        data = img.getdata()
        
        # Remove black background (tolerance 30)
        new_data = []
        for item in data:
            if item[0] < 30 and item[1] < 30 and item[2] < 30:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        img.putdata(new_data)
        
        # Increase brightness
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.2)
        
        # Increase contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)
        
        img.save(out_path)
        print(f"Successfully processed {in_path} -> {out_path}")
    except Exception as e:
        print(f"Error processing {in_path}: {e}")

process_logo("src/assets/logo.png", "src/assets/logo-trans1.png")
process_logo("src/assets/logo.jpg", "src/assets/logo-trans2.png")
