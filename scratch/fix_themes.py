import re
import os

def fix_file(file_path):
    print(f"Fixing file: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Basic replacements
    replacements = {
        'bg-[#FAFAFA]': 'bg-background',
        'bg-[#FAFAFA]/50': 'bg-background/50',
        'bg-[#FAFAF8]': 'bg-background',
        'bg-[#FAF9F5]': 'bg-background',
        'bg-[#FAF9F6]': 'bg-background',
        'text-[#111111]': 'text-foreground',
        'text-gray-900': 'text-foreground',
        'text-zinc-900': 'text-foreground',
        'text-gray-800': 'text-foreground',
        'text-zinc-800': 'text-foreground',
        'text-gray-700': 'text-foreground/90',
        'text-zinc-700': 'text-foreground/90',
        'text-gray-600': 'text-foreground/80',
        'text-zinc-600': 'text-foreground/80',
        'text-gray-500': 'text-muted-foreground',
        'text-zinc-500': 'text-muted-foreground',
        'text-gray-400': 'text-muted-foreground',
        'text-zinc-400': 'text-muted-foreground',
        'text-gray-300': 'text-muted-foreground/60',
        'text-zinc-300': 'text-muted-foreground/60',
        'text-gray-200': 'text-border',
        'text-zinc-200': 'text-border',
        'bg-white': 'bg-card',
        'border-[#ECECEC]': 'border-border',
        'border-[#EAEAEA]': 'border-border',
        'border-[#EAE6DF]': 'border-border',
        'bg-gray-50': 'bg-muted',
        'bg-zinc-50': 'bg-muted',
        'bg-gray-50/50': 'bg-muted/30',
        'bg-zinc-50/50': 'bg-muted/30',
        'hover:bg-gray-50': 'hover:bg-muted',
        'hover:bg-zinc-50': 'hover:bg-muted',
        'hover:bg-gray-50/40': 'hover:bg-muted/40',
        'hover:bg-zinc-50/40': 'hover:bg-muted/40',
        'bg-amber-50/60': 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]/20',
        'bg-[#D4AF37]': 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]/20',
        'hover:bg-[#c4a030]': 'hover:bg-[#F4C542] dark:hover:bg-[#3d331a]',
        'hover:bg-[#d4af37]': 'hover:bg-[#F4C542] dark:hover:bg-[#3d331a]',
        'text-[#D4AF37]': 'text-[#F4C542]',
        'accent-[#D4AF37]': 'accent-[#F4C542]',
        'bg-amber-50': 'bg-[#FFF7D6] dark:bg-[#2E2818]/40',
        'text-amber-800': 'text-[#A3843B] dark:text-[#F4C542]',
        'border-amber-100': 'border-[#F4C542]/20',
        'border-amber-200/60': 'border-[#F4C542]/30',
        'bg-[#FAF9F5]/30': 'bg-muted/30',
        'bg-slate-50/50': 'bg-background',
        'bg-slate-50': 'bg-muted',
        'border-slate-200': 'border-border',
        'border-slate-100': 'border-border',
        'text-slate-900': 'text-foreground',
        'text-slate-800': 'text-foreground',
        'text-slate-700': 'text-foreground/90',
        'text-slate-600': 'text-foreground/80',
        'text-slate-500': 'text-muted-foreground',
        'text-slate-400': 'text-muted-foreground',
        'text-slate-300': 'text-muted-foreground/60',
        'hover:bg-slate-50': 'hover:bg-muted',
        'hover:bg-slate-50/80': 'hover:bg-muted/80',
        'bg-slate-100': 'bg-muted',
        'border-slate-200/60': 'border-border/60',
        'ring-white': 'ring-card',
    }

    # Apply simple replacements
    for old, new in replacements.items():
        content = content.replace(old, new)

    # Clean up comments (regex to remove JS comments)
    # We should be careful to only remove comments and not URLs like https://...
    # Let's write a clean comment remover.
    def remove_comments(text):
        # Remove single line comments that do not start with http or https
        lines = text.split('\n')
        new_lines = []
        for line in lines:
            # Match // not preceded by http: or https:
            # We can do this by splitting on // and checking if the prefix ends with :
            parts = line.split('//')
            if len(parts) > 1:
                # Reconstruct if it's a URL
                reconstructed = parts[0]
                has_comment = False
                for i in range(1, len(parts)):
                    if reconstructed.endswith('http:') or reconstructed.endswith('https:'):
                        reconstructed += '//' + parts[i]
                    else:
                        # This is a comment! Discard the rest
                        has_comment = True
                        break
                if not has_comment:
                    new_lines.append(line)
                else:
                    new_lines.append(reconstructed.rstrip())
            else:
                new_lines.append(line)
                
        # Now remove block comments /* ... */
        text_no_comments = '\n'.join(new_lines)
        text_no_comments = re.sub(r'/\*.*?\*/', '', text_no_comments, flags=re.DOTALL)
        return text_no_comments

    # Let's check user requested 100% comment-free
    content = remove_comments(content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

# Fix targeted files
files_to_fix = [
    r"c:\website\tp\app\(admin)\admin\faq\page.tsx",
    r"c:\website\tp\app\(admin)\admin\announcements\page.tsx",
]

for f in files_to_fix:
    if os.path.exists(f):
        fix_file(f)
