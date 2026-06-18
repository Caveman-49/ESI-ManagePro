#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('src/App.jsx', 'rb') as f:
    content = f.read()

# The bad sequence is: 0xc3 0xa2 0xe2 0x80 0x9d 0xe2 0x82 0xac (repeated)
# This represents the corrupted "â"€" character
bad_pair = b'\xc3\xa2\xe2\x80\x9d\xe2\x82\xac'  # One â"€ instance

# Replace pairs and triplets
content = content.replace(bad_pair + bad_pair + bad_pair, b'---')  # 3 pairs = 3 dashes
content = content.replace(bad_pair + bad_pair, b'--')  # 2 pairs = 2 dashes
content = content.replace(bad_pair, b'-')  # Single pair = 1 dash

# Also remove the long corrupted line that starts with // followed by many of these
# Find and remove lines that are just comments with these corrupted dashes
lines = content.split(b'\r\n')
cleaned_lines = []
for line in lines:
    # Skip lines that are just // followed by many bad characters
    if line.startswith(b'// ') and len(line) > 100 and b'\xc3\xa2' in line:
        continue
    cleaned_lines.append(line)

content = b'\r\n'.join(cleaned_lines)

with open('src/App.jsx', 'wb') as f:
    f.write(content)

print('✓ Encoding fixed successfully!')
