import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InstallPWABanner from "../components/InstallPWABanner";
import HomeCitySelector from "../components/HomeCitySelector";
import prisma from "../lib/prisma";
import { getStateDisplay } from "../lib/utils";

export const revalidate = 60;

export const metadata = {
  title: "Nosso Local - Shopping virtual para o comércio local",
  description:
    "Descubra os produtos das melhores lojas da sua região! Shopping virtual para o comércio local.",
};

export default async function Home() {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      city: true,
      state: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstallPWABanner />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Shopping virtual para o comércio local
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Descubra os produtos das melhores lojas da sua região!
            </p>

            {/* Seletor de Localização (Client Component) */}
            <HomeCitySelector />
          </div>
        </div>
      </section>

      {/* Seção Para Lojistas */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 border-2 border-green-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Conteúdo */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Você é Lojista?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Leve sua loja para o digital! Gerencie seus produtos, receba
                  pedidos e ofereça delivery aos seus clientes - totalmente
                  grátis.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Cadastre sua loja em minutos
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Gerencie produtos e estoque facilmente
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Receba pedidos e configure delivery
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Nenhuma taxa ou mensalidade
                  </li>
                </ul>
                <Link
                  href="/para-lojistas"
                  className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Saiba Mais →
                </Link>
              </div>

              {/* Ícone */}
              <div className="text-center">
                <div className="text-9xl mb-4">🏪</div>
                <p className="text-gray-600 font-medium">
                  Junte-se a nossos lojistas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Lojas Ativas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Lojas Disponíveis na Plataforma
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores && stores.length > 0 ? (
              stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-gray-50 p-6 rounded-lg shadow-md min-h-80 flex flex-col items-center text-center"
                >
                  <Link href={`/lojas/${store.slug}`} className="w-full block">
                    <div className="w-full aspect-square hover:opacity-80 transition-opacity rounded-md overflow-hidden mb-4">
                      <Image
                        src={store.image || "/no-image.png"}
                        alt={store.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain bg-white"
                      />
                    </div>
                  </Link>
                  <Link
                    href={`/lojas/${store.slug}`}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {store.name}
                  </Link>
                  <p className="text-gray-600 mt-2">
                    {store.city}, {getStateDisplay(store.state)}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  Nenhuma loja disponível no momento
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
