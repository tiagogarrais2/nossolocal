import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import {
  sendVerificationRequest,
  sendNewUserNotificationToAdmins,
} from "@/lib/email";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  debug: true, // Abilitar debug em desenvolvimento
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Permitir linking de contas com mesmo email
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASS,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        console.log("=== SIGNIN CALLBACK START ===");
        console.log("User:", user);
        console.log("Account:", account);
        console.log("Profile:", profile);
        console.log("IsNewUser:", isNewUser);

        if (!user || !user.email) {
          console.error("User ou email não disponível:", user);
          return false;
        }

        // Se é novo usuário, enviar notificação para administradores
        if (isNewUser && user?.id) {
          console.log("Novo usuário detectado, processando...");
          // Tentar enviar e-mail, mas não bloquear o login se falhar
          try {
            // Verificar configuração antes de enviar
            try {
              console.log("Buscando configuração de admin...");
              const setting = await prisma.adminSettings.findUnique({
                where: { key: "emailOnNewUser" },
              });
              console.log("Configuração encontrada:", setting);

              if (setting?.value === true) {
                console.log("Enviando e-mail de novo usuário...");
                const fullUser = await prisma.user.findUnique({
                  where: { id: user.id },
                });

                if (fullUser) {
                  await sendNewUserNotificationToAdmins({ user: fullUser });
                  console.log("E-mail de novo usuário enviado com sucesso");
                }
              }
            } catch (settingError) {
              console.error("Erro ao buscar configuração de admin:", settingError);
              // Continuar sem enviar e-mail
            }

            // Tentar verificar se precisa de onboarding
            try {
              console.log("Buscando perfil do usuário...");
              const userProfile = await prisma.usuario.findUnique({
                where: { userId: user.id },
              });
              console.log("Perfil encontrado:", userProfile);
              // Perfil será verificado novamente no session callback
            } catch (profileError) {
              console.error("Erro ao buscar perfil do usuário:", profileError);
              // Continuar sem o perfil
            }
          } catch (emailError) {
            console.error("Erro ao processar novo usuário:", emailError);
            // Não impedir o login se algo falhar
          }
        }

        console.log("=== SIGNIN CALLBACK SUCCESS ===");
        // IMPORTANTE: Retornar true para permitir o login
        // Todos os erros de banco de dados são não-críticos
        return true;
      } catch (error) {
        console.error("=== SIGNIN CALLBACK ERROR ===");
        console.error("Erro crítico no callback signIn:", error);
        console.error("Stack:", error.stack);
        // Retornar true mesmo em erro para permitir que o NextAuth continue
        // e o erro não interrompa o fluxo OAuth
        return true;
      }
    },
    async session({ session, user }) {
      try {
        console.log("SESSION CALLBACK CALLED");
        console.log("Session callback called with user:", user);
        console.log("Session callback called with session:", session);
        
        // Adicionar ID do usuário à sessão
        if (user?.id) {
          session.user.id = user.id;
          console.log("Set session.user.id to:", user.id);
        }
        
        // Adicionar campos do perfil da tabela Usuario (não-crítico)
        try {
          if (session?.user?.id) {
            const profile = await prisma.usuario.findUnique({
              where: { userId: session.user.id },
            });
            if (profile) {
              session.user = {
                ...session.user,
                fullName: profile.fullName,
                birthDate: profile.birthDate,
                cpf: profile.cpf,
                whatsapp: profile.whatsapp,
                whatsappCountryCode: profile.whatsappCountryCode,
                whatsappConsent: profile.whatsappConsent,
              };
            }
          }
        } catch (dbError) {
          console.error("Erro ao buscar dados do usuário:", dbError);
          // Continuar sem os dados extras do perfil
          // A sessão já tem user.id, que é o importante
        }
        
        console.log("Session callback returning session:", session);
        return session;
      } catch (error) {
        console.error("Erro crítico no callback de sessão:", error);
        // Retornar a sessão mesmo se houve erro
        // O importante é que o user.id estava preenchido antes do try
        return session;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          console.log(
            "JWT callback - user.id:",
            user.id,
            "type:",
            typeof user.id
          );
          token.id = user.id;
        }
        return token;
      } catch (error) {
        console.error("Erro no callback JWT:", error);
        return token;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        console.log("Redirect callback:", { url, baseUrl });
        
        // Se a URL começa com o baseUrl ou é um caminho relativo, use-a
        if (url.startsWith(baseUrl)) {
          return url;
        }
        
        // Se é um caminho relativo, retorne com baseUrl
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        
        // Caso contrário, redirecione para o painel
        return `${baseUrl}/painel`;
      } catch (error) {
        console.error("Erro no callback redirect:", error);
        // Retornar para o painel em caso de erro
        return baseUrl;
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("✅ SIGNIN EVENT FIRED");
      console.log("User:", user?.email);
      console.log("Account:", account?.provider);
      console.log("IsNewUser:", isNewUser);
    },
    async error({ error }) {
      console.error("❌ NEXTAUTH ERROR EVENT:");
      console.error("Error:", error);
      console.error("Error type:", typeof error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    },
    async session({ session }) {
      console.log("✅ SESSION EVENT:", session?.user?.email);
    },
  },
};
