import nodemailer from "nodemailer";

// Criar transporter reutilizável
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASS,
      },
    });
  }
  return transporter;
}

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider,
}) {
  // Usar o mesmo transporter das outras funções para consistência
  const transporter = getTransporter();

  console.log(`Enviando e-mail de verificação para: ${email}`);

  const message = {
    to: email,
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    subject: "Seu link mágico de login",
    text: `Use este link para entrar: ${url}`,
    html: `<p>Use este link para entrar:</p><p><a href="${url}">${url}</a></p>`,
  };

  try {
    await transporter.sendMail(message);
    console.log(`E-mail de verificação enviado com sucesso para ${email}`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail de verificação para ${email}:`, error);
    throw error; // Re-throw para que o chamador possa lidar com o erro
  }
}

// Função para enviar notificação aos administradores sobre novo usuário
export async function sendNewUserNotificationToAdmins({ user }) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminList.length === 0) {
    console.log("Nenhum e-mail de administrador configurado.");
    return;
  }

  console.log(
    `Enviando notificação de novo usuário para: ${adminList.join(", ")}`,
  );

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">👤 Novo Usuário Cadastrado!</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f2937;">Detalhes do Usuário</h3>
        <p><strong>Nome:</strong> ${user.name || "Não informado"}</p>
        <p><strong>E-mail:</strong> ${user.email}</p>
        <p><strong>Data de Cadastro:</strong> ${new Date(
          user.createdAt,
        ).toLocaleString("pt-BR")}</p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Este é um email automático do sistema de delivery.</p>
      </div>
    </div>
  `;

  const textContent = `
    Novo Usuário Cadastrado
    
    Nome: ${user.name || "Não informado"}
    E-mail: ${user.email}
    Data de Cadastro: ${new Date(user.createdAt).toLocaleString("pt-BR")}
  `;

  const message = {
    to: adminList,
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    subject: `👤 Novo Usuário Cadastrado - ${user.email}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    await getTransporter().sendMail(message);
    console.log("Notificação de novo usuário enviada com sucesso");
  } catch (error) {
    console.error("Erro ao enviar notificação de novo usuário:", error);
    throw error; // Re-throw para que o chamador possa lidar com o erro
  }
}

// Função para enviar notificação aos administradores sobre nova loja
export async function sendNewStoreNotificationToAdmins({ store, owner }) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminList.length === 0) {
    console.log("Nenhum e-mail de administrador configurado.");
    return;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">🏪 Nova Loja Cadastrada!</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f2937;">Detalhes da Loja</h3>
        <p><strong>Nome:</strong> ${store.name}</p>
        <p><strong>Slug:</strong> ${store.slug}</p>
        <p><strong>Categoria:</strong> ${store.category}</p>
        <p><strong>CNPJ:</strong> ${store.cnpj}</p>
        <p><strong>Telefone:</strong> ${store.phone}</p>
        <p><strong>E-mail:</strong> ${store.email}</p>
        <p><strong>Cidade:</strong> ${store.city}/${store.state}</p>
        ${
          store.description
            ? `<p><strong>Descrição:</strong> ${store.description}</p>`
            : ""
        }
      </div>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f2937;">Proprietário</h3>
        <p><strong>Nome:</strong> ${owner.name || "Não informado"}</p>
        <p><strong>E-mail:</strong> ${owner.email}</p>
      </div>

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f2937;">Endereço</h3>
        <p>${store.street}, ${store.number}${
          store.complement ? ` - ${store.complement}` : ""
        }</p>
        <p>${store.neighborhood}</p>
        <p>${store.city} - ${store.state}</p>
        <p>CEP: ${store.zipCode}</p>
      </div>

      <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #1e40af;">
          Data de Cadastro: ${new Date(store.createdAt).toLocaleString("pt-BR")}
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Este é um email automático do sistema de delivery.</p>
      </div>
    </div>
  `;

  const textContent = `
    Nova Loja Cadastrada
    
    Detalhes da Loja:
    Nome: ${store.name}
    Slug: ${store.slug}
    Categoria: ${store.category}
    CNPJ: ${store.cnpj}
    Telefone: ${store.phone}
    E-mail: ${store.email}
    Cidade: ${store.city}/${store.state}
    ${store.description ? `Descrição: ${store.description}` : ""}
    
    Proprietário:
    Nome: ${owner.name || "Não informado"}
    E-mail: ${owner.email}
    
    Endereço:
    ${store.street}, ${store.number}${
      store.complement ? ` - ${store.complement}` : ""
    }
    ${store.neighborhood}
    ${store.city} - ${store.state}
    CEP: ${store.zipCode}
    
    Data de Cadastro: ${new Date(store.createdAt).toLocaleString("pt-BR")}
  `;

  const message = {
    to: adminList,
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    subject: `🏪 Nova Loja Cadastrada - ${store.name}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    await getTransporter().sendMail(message);
    console.log("Notificação de nova loja enviada com sucesso");
  } catch (error) {
    console.error("Erro ao enviar notificação de nova loja:", error);
    throw error; // Re-throw para que o chamador possa lidar com o erro
  }
}

// Função para enviar notificação de novo pedido para a loja
export async function sendOrderNotificationToStore({
  storeEmail,
  storeName,
  order,
  customerName,
}) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${
        item.productName
      }</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(
        item.price,
      )}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(
        item.price * item.quantity,
      )}</td>
    </tr>`,
    )
    .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🛍️ Novo Pedido Recebido!</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f2937;">Detalhes do Pedido</h3>
        <p><strong>Número:</strong> #${order.id.slice(-8).toUpperCase()}</p>
        <p><strong>Data:</strong> ${new Date(order.createdAt).toLocaleString(
          "pt-BR",
        )}</p>
        <p><strong>Pagamento:</strong> ${
          order.paymentMethod === "pix"
            ? "PIX"
            : order.paymentMethod === "cash"
              ? "Dinheiro"
              : order.paymentMethod
        }</p>
        ${
          order.needsChange
            ? `<p><strong>Troco para:</strong> ${formatPrice(
                order.changeAmount,
              )}</p>`
            : ""
        }
        <p><strong>Tipo de Entrega:</strong> ${
          order.deliveryType === "pickup"
            ? "🏪 Retirada na Loja"
            : "🚚 Entrega em Domicílio"
        }</p>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937;">Itens do Pedido</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db;">Produto</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #d1d5db;">Qtd</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #d1d5db;">Valor Unit.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #d1d5db;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Subtotal:</span>
          <strong>${formatPrice(order.subtotal)}</strong>
        </div>
        ${
          order.deliveryFee > 0
            ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Taxa de entrega:</span>
          <strong>${formatPrice(order.deliveryFee)}</strong>
        </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; font-size: 18px; color: #059669; border-top: 2px solid #10b981; padding-top: 10px;">
          <span><strong>TOTAL:</strong></span>
          <strong>${formatPrice(order.total)}</strong>
        </div>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #92400e;">⚡ Ação Necessária</h3>
        <p style="margin: 0; color: #92400e;">Acesse sua loja para confirmar e preparar este pedido.</p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Este é um email automático do sistema de delivery.</p>
        <p>Para dúvidas, entre em contato com o suporte.</p>
      </div>
    </div>
  `;

  const textContent = `
    Novo Pedido Recebido - ${storeName}
    
    Número do Pedido: #${order.id.slice(-8).toUpperCase()}
    Data: ${new Date(order.createdAt).toLocaleString("pt-BR")}
    Pagamento: ${
      order.paymentMethod === "pix"
        ? "PIX"
        : order.paymentMethod === "cash"
          ? "Dinheiro"
          : order.paymentMethod
    }
    ${
      order.needsChange
        ? `Troco para: ${formatPrice(order.changeAmount)}\n`
        : ""
    }
    Tipo de Entrega: ${
      order.deliveryType === "pickup"
        ? "Retirada na Loja"
        : "Entrega em Domicílio"
    }
    
    Itens do Pedido:
    ${order.items
      .map(
        (item) =>
          `- ${item.productName} (${item.quantity}x) - ${formatPrice(
            item.price * item.quantity,
          )}`,
      )
      .join("\n    ")}
    
    Subtotal: ${formatPrice(order.subtotal)}
    ${
      order.deliveryFee > 0
        ? `Taxa de entrega: ${formatPrice(order.deliveryFee)}\n    `
        : ""
    }TOTAL: ${formatPrice(order.total)}
    
    Acesse sua loja para confirmar e preparar este pedido.
  `;

  const message = {
    to: storeEmail,
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    subject: `🛍️ Novo Pedido - ${storeName} (#${order.id
      .slice(-8)
      .toUpperCase()})`,
    text: textContent,
    html: htmlContent,
  };

  try {
    await getTransporter().sendMail(message);
    console.log(`Notificação de pedido enviada com sucesso para ${storeEmail}`);
  } catch (error) {
    console.error(
      `Erro ao enviar notificação de pedido para ${storeEmail}:`,
      error,
    );
    throw error; // Re-throw para que o chamador possa lidar com o erro
  }
}

// Função para enviar e-mail de teste
export async function sendTestEmail({ to, subject, message }) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">E-mail de Teste</h2>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>${message}</p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Este é um e-mail de teste do nossolocal.com.br</p>
        <p>Enviado em: ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>
  `;

  const textContent = `
    E-mail de Teste

    ${message}

    Este é um e-mail de teste do nossolocal.com.br.
    Enviado em: ${new Date().toLocaleString("pt-BR")}
  `;

  const emailMessage = {
    to,
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    subject: subject || "Teste de E-mail - nossolocal.com.br",
    text: textContent,
    html: htmlContent,
  };

  await getTransporter().sendMail(emailMessage);
}
