import sys

with open('src/App.jsx', 'rb') as f:
    content = f.read()

# Look for the malformed sequence
sample = content[2000:2200]
print("Sample bytes around position 2000-2200:")
print(sample[:50])
print()

# Find lines with 'Saved timetables'
idx = content.find(b'Saved timetables')
if idx > 0:
    print(f"Found 'Saved timetables' at position {idx}")
    print("Bytes before it:")
    print(repr(content[idx-50:idx+50]))
    print()

# Try to identify the bad dash characters
bad_dash_samples = [content[i:i+20] for i in range(0, len(content), 100) if b'\xc3\xa2' in content[i:i+20]]
if bad_dash_samples:
    print("Found UTF-8 corruption patterns:")
    for sample in bad_dash_samples[:5]:
        print(repr(sample))
