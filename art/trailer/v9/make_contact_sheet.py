from PIL import Image

files = ['sky.jpg', 'rooftops.jpg', 'street_shops.jpg', 'cafe_facade.jpg', 'foreground_yarn.jpg', 'dust_motes.jpg', 'title_card.jpg']
images = [Image.open(f) for f in files]
width, height = images[0].size
new_width = width * 4
new_height = height * 2
contact_sheet = Image.new('RGB', (new_width, new_height))

for i, img in enumerate(images):
    x = (i % 4) * width
    y = (i // 4) * height
    contact_sheet.paste(img, (x, y))

contact_sheet.save('contact_sheet.jpg')
