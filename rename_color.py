import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace class names containing 'purple'
    # Examples: text-purple, bg-purple, shadow-purple/20, hover:bg-purple, purple-500, from-purple
    
    # Let's replace 'purple/XX' with 'primary/XX'
    # 'purple' -> 'primary'
    # 'purple-XXX' -> 'primary' (since primary doesn't have scales in this theme)

    replaced = content
    # First, handle purple-XXX/YY -> primary/YY
    replaced = re.sub(r'\b([a-z:-]*)purple-[0-9]+/([0-9]+)\b', r'\1primary/\2', replaced)
    # Then handle purple-XXX -> primary
    replaced = re.sub(r'\b([a-z:-]*)purple-[0-9]+\b', r'\1primary', replaced)
    # Then handle purple/YY -> primary/YY
    replaced = re.sub(r'\b([a-z:-]*)purple/([0-9]+)\b', r'\1primary/\2', replaced)
    # Finally handle purple -> primary
    replaced = re.sub(r'\b([a-z:-]*)purple\b', r'\1primary', replaced)
    
    if content != replaced:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(replaced)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('apps/web'):
    if 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            replace_in_file(os.path.join(root, file))
