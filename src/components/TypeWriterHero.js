"use client";

import { useState, useEffect } from "react";

const WORDS = [
  "sua Loja",
  "seu serviço",
  "seu Negócio",
  "sua Empresa",
  "sua Marca",
  "seu Comércio",
  "sua Startup",
  "seu Projeto",
  "sua Iniciativa",
  "seu Empreendimento",
  "sua Organização",
  "seu Estabelecimento",
  "sua Boutique",
  "seu Atacado",
  "sua Distribuidora",
  "seu Armazém",
  "sua Padaria",
  "seu Açougue",
  "sua Farmácia",
  "seu Mercado",
  "sua Loja de Roupas",
  "seu Salão de Beleza",
  "sua Oficina Mecânica",
  "seu Estúdio de Yoga",
  "sua Academia de Ginástica",
  "sua Agência de Viagens",
  "seu Hotel",
  "sua Associação",
  "sua Cooperativa",
  "sua Mercearia",
  "sua Padaria",
  "sua Sorveteria",
  "sua Cafeteria",
  "sua Estética",
  "sua Barbearia",
  "seu Restaurante",
  "seu Bistrô",
  "sua Floricultura",
  "seu Pet Shop",
  "sua Livraria",
  "seu Ateliê",
  "sua Oficina",
  "sua Academia",
  "seu Cinema",
  "sua Clínica",
  "seu Consultório",
  "sua Escola",
  "sua Creche",
  "seu Buffet",
  "seu Salão de Festas",
  "seu Espaço de Eventos",
  "Seu Evento",
];

export default function TypeWriterHero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const getRandomWordIndex = (currentIndex) => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * WORDS.length);
    } while (newIndex === currentIndex && WORDS.length > 1);
    return newIndex;
  };

  useEffect(() => {
    const currentWord = WORDS[currentWordIndex];
    let timer;

    if (!isDeleting && displayedText.length < currentWord.length) {
      // Digitando
      timer = setTimeout(() => {
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
      }, 100); // Velocidade de digitação
    } else if (!isDeleting && displayedText.length === currentWord.length) {
      // Aguardando antes de apagar
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000); // Tempo que fica exibido
    } else if (isDeleting && displayedText.length > 0) {
      // Apagando
      timer = setTimeout(() => {
        setDisplayedText(displayedText.substring(0, displayedText.length - 1));
      }, 50); // Velocidade de apagamento
    } else if (isDeleting && displayedText.length === 0) {
      // Próxima palavra (aleatória)
      setIsDeleting(false);
      setCurrentWordIndex(getRandomWordIndex(currentWordIndex));
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]);

  // Piscar cursor
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
      Traga{" "}
      <span className="text-blue-600 font-bold">
        {displayedText}
        <span
          className={`transition-opacity ${cursorVisible ? "opacity-100" : "opacity-0"}`}
        >
          |
        </span>
      </span>
      para o digital
    </h1>
  );
}
