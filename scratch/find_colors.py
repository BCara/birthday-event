import os
import re

root_dir = r"c:\Users\clbbe\Documents\Projects\BirthdayEvent\src"
for dirpath, _, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(('.css', '.jsx', '.js')):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Check for "color:" and check what values it has
                matches = re.finditer(r'color:\s*[\'"`]?[#a-zA-Z0-9(),\s.-]+[\'"`]?', content)
                for m in matches:
                    line_num = content.count('\n', 0, m.start()) + 1
                    # print matching line
                    line = content.split('\n')[line_num - 1]
                    if 'white' in line.lower() or '#fff' in line.lower() or 'var(' in line.lower():
                        print(f"{filename}:{line_num}: {line.strip()}")
