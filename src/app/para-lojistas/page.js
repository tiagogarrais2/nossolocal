"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ParaLojistasPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Leve sua loja para o digital
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Nos so Local é um shopping virtual para o comércio local. Gerencie
              sua loja online e oferça delivery aos seus clientes - totalmente
              grátis!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                Começar Agora
              </Link>
              <Link
                href="#como-funciona"
                className="bg-gray-200 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors"
              >
                Saiba Mais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Como Funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Organização por Cidade
              </h3>
              <p className="text-gray-600">
                Suas lojas são agrupadas por cidade, facilitando que clientes
                locais te encontrem facilmente.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Busca Local
              </h3>
              <p className="text-gray-600">
                Clientes buscam sua cidade e encontram todos os estabelecimentos
                disponíveis para compra online.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Entrega Regional
              </h3>
              <p className="text-gray-600">
                Oferça delivery dentro da sua cidade com taxas configuráveis e
                pedido mínimo controlado por você.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Fluxo de Compra
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <p className="text-gray-600">Cliente seleciona sua cidade</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <p className="text-gray-600">Visualiza lojas disponíveis</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <p className="text-gray-600">Escolhe produtos e carrinho</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <p className="text-gray-600">Realiza pedido com entrega</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Funcionalidades Completas
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Gerenciamento da Loja */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🏪</span>
                Gerenciamento da Loja
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Cadastro de Loja
                    </p>
                    <p className="text-gray-600 text-sm">
                      Registre com todas as informações: nome, endereço,
                      categoria, logo
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Configuração de Delivery
                    </p>
                    <p className="text-gray-600 text-sm">
                      Defina taxas, pedidos mínimos e frete grátis
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Período de Funcionamento
                    </p>
                    <p className="text-gray-600 text-sm">
                      Controle quando sua loja recebe pedidos
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Gerenciamento de Produtos */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📦</span>
                Gerenciamento de Produtos
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Cadastro de Produtos
                    </p>
                    <p className="text-gray-600 text-sm">
                      Adicione nome, descrição, preço e imagens profissionais
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Controle de Estoque
                    </p>
                    <p className="text-gray-600 text-sm">
                      Ative/desative produtos conforme disponibilidade
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Gestão Flexible
                    </p>
                    <p className="text-gray-600 text-sm">
                      Indique estoque ou deixe sem limite definido
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Gestão Financeira */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">💰</span>
                Gestão Financeira
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Chaves PIX</p>
                    <p className="text-gray-600 text-sm">
                      Configure suas chaves PIX para receber pagamentos
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Gerenciamento de Pedidos
                    </p>
                    <p className="text-gray-600 text-sm">
                      Visualize e processe pedidos em tempo real
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Histórico Completo
                    </p>
                    <p className="text-gray-600 text-sm">
                      Acompanhe todas as suas transações e vendas
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Painel Administrativo */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📊</span>
                Painel Administrativo
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pedidos Pendentes
                    </p>
                    <p className="text-gray-600 text-sm">
                      Acompanhe e confirme pedidos em tempo real
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Dashboard Intuitivo
                    </p>
                    <p className="text-gray-600 text-sm">
                      Interface simples e fácil de usar
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Relatórios</p>
                    <p className="text-gray-600 text-sm">
                      Veja o histórico completo de vendas
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Sem Custos, Totalmente Grátis
          </h2>

          <div className="bg-white rounded-lg p-12 shadow-lg text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Nenhuma Taxa ou Mensalidade
            </h3>
            <p className="text-xl text-gray-600 mb-6">
              Utilize nossa plataforma gratuitamente para gerenciar sua loja e
              oferecer delivery aos seus clientes.
            </p>
            <p className="text-gray-600">
              Pelo menos neste início, não estamos cobrando nada. Você tem
              acesso completo a todas as funcionalidades sem custos!
            </p>
          </div>
        </div>
      </section>

      {/* Como Começar */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Como Começar
          </h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Passo 1 */}
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Cadastro da Loja
                </h3>
              </div>
              <ol className="text-gray-600 space-y-3 ml-16">
                <li>1. Acesse nosso site e cadastre-se ou faça login</li>
                <li>2. Clique em "Meu Painel" → "Minhas lojas"</li>
                <li>3. Clique em "Cadastrar Nova Loja"</li>
                <li>4. Preencha todos os dados solicitados</li>
              </ol>
            </div>

            {/* Passo 2 */}
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Adicione Produtos
                </h3>
              </div>
              <ol className="text-gray-600 space-y-3 ml-16">
                <li>1. Vá em "Meu Painel" → "Minhas lojas"</li>
                <li>2. Selecione sua loja e "Gerenciar Produtos"</li>
                <li>3. Clique em adicionar novos produtos</li>
                <li>4. Preencha dados, preços e imagens</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Cadastre sua loja agora e comece a vender online em minutos
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Cadastrar Minha Loja
          </Link>
        </div>
      </section>

      {/* Suporte */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Precisa de Ajuda?
          </h2>

          <div className="bg-white rounded-lg p-8 shadow-md max-w-2xl mx-auto text-center">
            <p className="text-xl text-gray-600 mb-6">
              Em caso de dúvidas ou problemas técnicos, entre em contato
              conosco:
            </p>
            <a
              href="https://wa.me/5588997230860"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>💬</span>
              Falar via WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
