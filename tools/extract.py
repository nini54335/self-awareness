import re, io

base = 'c:/Users/华为/Documents/trae_projects/self_awareness'
html = io.open(base + '/index.html', encoding='utf-8').read()
m = re.search(r'<script type="text/babel" data-presets="react">(.*?)</script>\s*</body>', html, re.S)
assert m, 'babel script block not found'
io.open(base + '/app.jsx', 'w', encoding='utf-8').write(m.group(1).strip() + '\n')

new_html = html.replace(
    '<script src="./vendor/babel.min.js"></script>\n', ''
).replace(
    '<script type="text/babel" data-presets="react">' + m.group(1) + '</script>',
    '<script src="./app.js"></script>'
)
assert 'text/babel' not in new_html
io.open(base + '/index.html', 'w', encoding='utf-8').write(new_html)
print('OK, jsx length =', len(m.group(1)))
