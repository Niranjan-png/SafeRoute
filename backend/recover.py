import json
import os
import ast

log_file = r'C:\Users\nisha\.gemini\antigravity-ide\brain\0f90dd01-cd0e-47cc-9791-396d9df60049\.system_generated\logs\transcript.jsonl'
files = {}

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        if not line.strip(): continue
        try:
            obj = json.loads(line)
        except:
            continue
            
        for t in obj.get('tool_calls', []):
            if t.get('name') == 'write_to_file':
                args = t.get('args', {})
                target_file = args.get('TargetFile', '')
                
                # Try un-escaping the JSON strings
                try:
                    target_file = ast.literal_eval(target_file) if target_file.startswith('"') else target_file
                except:
                    pass
                
                if 'app' in target_file.lower() and target_file.endswith('.py'):
                    clean_path = target_file.replace('\\\\', '/').replace('\\', '/')
                    
                    content = args.get('CodeContent', '')
                    if content:
                        try:
                            content = ast.literal_eval(content) if content.startswith('"') else content
                        except:
                            pass
                        files[clean_path] = content

print(f"Found {len(files)} files to restore.")

for path, content in files.items():
    if not path.lower().startswith('d:/saferoute'): continue
    print(f"Restoring {path}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
