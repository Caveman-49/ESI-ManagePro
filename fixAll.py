import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace malformed dash sequences with proper ones
content = content.replace('â"€â"€â"€', '---')
content = content.replace('â"€â"€', '--')
content = content.replace('â"€', '-')

# Clean up the long corrupted line
lines = content.split('\n')
new_lines = []
for line in lines:
    if line.startswith('// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬'):
        continue
    new_lines.append(line)

content = '\n'.join(new_lines)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File encoding fixed!')
