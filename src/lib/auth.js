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
  adapter: PrismaAdapter(prisma), // Usar adapter padrão temporariamente
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    // you can customize sign in/out/error etc here
  },
  callbacks: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        console.log("SignIn callback:", {
          user: user?.email,
          account: account?.provider,
          userId: user?.id,
          userIdType: typeof user?.id,
          isNewUser,
        });

        // Se é novo usuário, enviar notificação para administradores
        if (isNewUser && user?.id) {
          try {
            // Verificar configuração antes de enviar
            const setting = await prisma.adminSettings.findUnique({
              where: { key: "emailOnNewUser" },
            });

            if (setting?.value === true) {
              const fullUser = await prisma.user.findUnique({
                where: { id: user.id },
              });

              if (fullUser) {
                await sendNewUserNotificationToAdmins({ user: fullUser });
              }
            }
          } catch (emailError) {
            console.error("Erro ao enviar e-mail de novo usuário:", emailError);
            // Não impedir o login se o e-mail falhar
          }

          // Verificar se precisa de onboarding
          const userProfile = await prisma.usuario.findUnique({
            where: { userId: user.id },
          });

          // Se não tem perfil, será redirecionado para onboarding na página
          // Note: needsOnboarding será definido no session callback
        }

        return true;
      } catch (error) {
        console.error("Erro no callback signIn:", error);
        return false;
      }
    },
    async session({ session, user }) {
      try {
        console.log("SESSION CALLBACK CALLED");
        console.log("Session callback called with user:", user);
        console.log("Session callback called with session:", session);
        if (user) {
          session.user.id = user.id;
          console.log("Set session.user.id to:", user.id);
        }
        // Adicionar campos do perfil da tabela Usuario
        try {
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
        } catch (dbError) {
          console.error("Erro ao buscar dados do usuário no banco:", dbError);
          // Continuar sem os dados extras do perfil
        }
        console.log("Session callback returning session:", session);
        return session;
      } catch (error) {
        console.error("Erro no callback de sessão:", error);
        // Retornar sessão sem campos extras em caso de erro
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
  },
};
