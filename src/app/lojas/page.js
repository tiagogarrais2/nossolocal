import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { formatPrice, getStateDisplay } from "../../lib/utils";
import prisma from "../../lib/prisma";

export const revalidate = 60;

export async function generateMetadata({ searchParams }) {
  const { city } = await searchParams;
  if (city) {
    return {
      title: `Lojas em ${city} - Nosso Local`,
      description: `Encontre as melhores lojas em ${city} no Nosso Local. Shopping virtual para o comércio local.`,
    };
  }
  return {
    title: "Lojas - Nosso Local",
    description: "Encontre as melhores lojas da sua região no Nosso Local.",
  };
}

export default async function LojasPage({ searchParams }) {
  const { city, state } = await searchParams;

  if (!city || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Localização não selecionada
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Voltar para página inicial
          </Link>
        </div>
      </div>
    );
  }

  const stores = await prisma.store.findMany({
    where: {
      city: { equals: city.trim(), mode: "insensitive" },
      state: state.trim(),
    },
    orderBy: { createdAt: "desc" },
  });

  const estadoNome = getStateDisplay(state);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Location Info */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lojas em {city}
            </h1>
            <p className="text-gray-600">
              📍 {city}, {estadoNome}
            </p>
          </div>
        </div>

        {/* Stores List */}
        {stores.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhuma loja encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              Ainda não temos lojas cadastradas em {city}.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Buscar em outra cidade
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <Link href={`/lojas/${store.slug}`} className="block">
                  <div className="aspect-square hover:opacity-80 transition-opacity">
                    <Image
                      src={store.image || "/no-image.png"}
                      alt={`Imagem da loja ${store.name}`}
                      width={400}
                      height={400}
                      className="w-full h-full object-contain bg-white"
                    />
                  </div>
                </Link>
                <div className="p-6">
                  <div className="mb-2">
                    <Link href={`/lojas/${store.slug}`}>
                      <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {store.name}
                      </h3>
                    </Link>
                  </div>

                  {store.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {store.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start">
                      <span className="mr-2">🏠️</span>
                      <span>
                        {store.street}, {store.number}
                        {store.neighborhood && ` - ${store.neighborhood}`}
                      </span>
                    </div>

                    {store.latitude && store.longitude && (
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        <a
                          href={`https://www.google.com/maps/search/${store.latitude},${store.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Obter direções (Google Maps)
                        </a>
                      </div>
                    )}

                    {store.phone && (
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://wa.me/55${store.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          <span className="text-xs">(WhatsApp)</span>
                          {store.phone}
                        </a>
                      </div>
                    )}

                    {store.minimumOrder && (
                      <div className="flex items-center">
                        <span className="mr-2">💰</span>
                        <span>
                          Pedido mínimo: {formatPrice(store.minimumOrder)}
                        </span>
                      </div>
                    )}

                    {store.deliveryFee !== null &&
                      store.deliveryFee !== undefined && (
                        <div className="flex items-center">
                          <span className="mr-2">🚚</span>
                          <span>
                            Taxa de entrega:{" "}
                            {store.deliveryFee === 0
                              ? "Grátis"
                              : formatPrice(store.deliveryFee)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
