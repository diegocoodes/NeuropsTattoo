import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const computeOrigin = "https://s7e3a4d13fr61lrhlifcxim6.ewr.prisma.build";

for (const route of ["login", "admin"]) {
  const destination = `${computeOrigin}/${route}`;
  const directory = join("dist", route);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0;url=${destination}" />
    <title>Redirecionando...</title>
    <script>window.location.replace(${JSON.stringify(destination)});</script>
  </head>
  <body><p>Redirecionando para <a href="${destination}">o painel</a>.</p></body>
</html>
`);
}

console.log("Generated Hostinger login and admin redirects");
