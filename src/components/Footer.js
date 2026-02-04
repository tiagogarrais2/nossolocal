import Image from "next/image";

export default function Footer() {
  return (
    <div className="bg-gray-900 text-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
        <p>
          <a
            href="https://www.instagram.com/sitenossolocal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white inline-flex items-center"
          >
            <Image
              src="/Instagram_Glyph_Gradient.svg"
              alt="Instagram"
              width={20}
              height={20}
              className="mr-1"
            />{" "}
            Siga-nos no Instagram
          </a>
        </p>
        <p>&copy; 2026 Nosso Local. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
