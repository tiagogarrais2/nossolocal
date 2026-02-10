import Link from "next/link";

export default function LojistasPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            O digital é o lugar da sua loja
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            Não fique de fora da evolução do comércio local. Junte-se aos
            lojistas que já estão transformando seus negócios com o Nosso Local.
          </p>
          <Link
            href="/para-lojistas"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition"
          >
            Começar Agora
          </Link>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Clientes da sua cidade te encontram fácil
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Seleciona a Cidade
              </h3>
              <p className="text-gray-600">
                O cliente escolhe a cidade onde mora para ver as opções locais.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Visualiza Lojas
              </h3>
              <p className="text-gray-600">
                Sua loja aparece em destaque para quem está por perto.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Faz o Pedido
              </h3>
              <p className="text-gray-600">
                Compra rápida e direta pelo sistema, sem complicação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios de Pagamento */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Receba direto na sua conta, sem intermediários
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* PIX */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Pagamentos via PIX
              </h3>
              <p className="text-gray-600">
                Configure suas chaves e receba o valor das vendas
                instantaneamente.
              </p>
            </div>

            {/* Liberdade */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Liberdade Total
              </h3>
              <p className="text-gray-600">
                Sem taxas de antecipação ou retenção de valores por terceiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para levar sua loja ao digital?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Junte-se aos lojistas locais e comece a vender online hoje mesmo.
          </p>
          <Link
            href="/para-lojistas"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition"
          >
            Criar Minha Loja Agora
          </Link>
        </div>
      </section>
    </div>
  );
}
