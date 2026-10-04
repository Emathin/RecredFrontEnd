const fs = require('fs');
const p = 'src/app/features/perfil-usuario/perfil-usuario.page.ts';
let text = fs.readFileSync(p, 'utf8');
const lines = text.split('\n');
let replaced = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('toastService.mostrar') && lines[i].includes('${email}')) {
        lines[i] = "      this.toastService.mostrar(`Invitación enviada a ${email}. IMPORTANTE: El usuario no aparecerá en la lista hasta que acepte.`, 'success', 10000);";
        replaced = true;
    }
}
if (replaced) {
    fs.writeFileSync(p, lines.join('\n'), 'utf8');
    console.log("Success");
} else {
    console.log("Failed to find target line");
}
