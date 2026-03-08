#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const versionType = process.argv[2] || "patch";
const commitMessageArg = process.argv[3];

if (!["major", "minor", "patch"].includes(versionType)) {
  console.error("❌ Tipo de versão inválido. Use: major, minor ou patch");
  process.exit(1);
}

// Função para pedir mensagem de commit ao usuário
async function getCommitMessage(defaultMessage) {
  if (commitMessageArg) {
    return commitMessageArg;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `\n📝 Mensagem de commit (padrão: "${defaultMessage}"): `,
      (answer) => {
        rl.close();
        resolve(answer || defaultMessage);
      },
    );
  });
}

// Executar script
(async () => {
  try {
    // Ler package.json
    const packageJsonPath = path.join(__dirname, "../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // Parsear versão atual
    const currentVersion = packageJson.version;
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    // Incrementar versão
    let newVersion;
    if (versionType === "major") {
      newVersion = `${major + 1}.0.0`;
    } else if (versionType === "minor") {
      newVersion = `${major}.${minor + 1}.0`;
    } else {
      newVersion = `${major}.${minor}.${patch + 1}`;
    }

    // Incrementar swVersion (cache version simples)
    const currentSwVersion = packageJson.swVersion || 1;
    const newSwVersion = currentSwVersion + 1;

    // Atualizar package.json
    packageJson.version = newVersion;
    packageJson.swVersion = newSwVersion;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    );

    console.log(`✅ Versão atualizada: ${currentVersion} → ${newVersion}`);
    console.log(
      `✅ Cache version atualizada: v${currentSwVersion} → v${newSwVersion}`,
    );

    // Atualizar service-worker.js
    const swPath = path.join(__dirname, "../public/service-worker.js");
    let swContent = fs.readFileSync(swPath, "utf-8");

    // Substituir versões do cache
    const oldCacheName = `nosso-local-v${currentSwVersion}`;
    const newCacheName = `nosso-local-v${newSwVersion}`;

    swContent = swContent.replace(
      new RegExp(`"${oldCacheName}"`, "g"),
      `"${newCacheName}"`,
    );

    // Substituir versão do static cache também
    const oldStaticCache = `static-v${currentSwVersion}`;
    const newStaticCache = `static-v${newSwVersion}`;
    swContent = swContent.replace(
      new RegExp(`"${oldStaticCache}"`, "g"),
      `"${newStaticCache}"`,
    );

    // Substituir versão do dynamic cache também
    const oldDynamicCache = `dynamic-v${currentSwVersion}`;
    const newDynamicCache = `dynamic-v${newSwVersion}`;
    swContent = swContent.replace(
      new RegExp(`"${oldDynamicCache}"`, "g"),
      `"${newDynamicCache}"`,
    );

    fs.writeFileSync(swPath, swContent);

    console.log(`✅ Service worker atualizado`);

    // Pedir mensagem de commit ao usuário
    const defaultCommitMessage = `chore: bump version to ${newVersion} (sw-v${newSwVersion})`;
    const commitMessage = await getCommitMessage(defaultCommitMessage);

    // Fazer git add, commit e push
    try {
      execSync("git add -A", {
        stdio: "inherit",
      });
      execSync(`git commit -m "${commitMessage}"`, {
        stdio: "inherit",
      });
      console.log(`✅ Commit criado automaticamente`);

      execSync("git push", {
        stdio: "inherit",
      });
      console.log(`✅ Push realizado automaticamente`);
    } catch (error) {
      console.warn(
        "⚠️ Erro ao fazer commit/push. Você pode fazer manualmente com:",
      );
      console.warn(`   git commit -m "${commitMessage}"`);
      console.warn(`   git push`);
    }

    console.log("\n📦 Resumo:");
    console.log(`   Versão NPM: ${currentVersion} → ${newVersion}`);
    console.log(`   Cache Version: v${currentSwVersion} → v${newSwVersion}`);
    console.log(`   Commit: ${commitMessage}`);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
})();
