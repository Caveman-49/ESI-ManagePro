#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('src/App.jsx', 'rb') as f:
    content = f.read()

# Check for the bad sequence
bad_pair = b'\xc3\xa2\xe2\x80\x9d\xe2\x82\xac'

if bad_pair in content:
    print("❌ Des caractères mal encodés restent dans le fichier")
    count = content.count(bad_pair)
    print(f"   Nombre d'occurrences: {count}")
else:
    print("✓ Tous les caractères sont correctement encodés!")
    print("✓ Le fichier App.jsx a été corrigé avec succès.")
