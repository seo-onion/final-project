import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">PlazaVea</h3>
            <p className="text-gray-400 text-sm">
              Tu supermercado online de confianza. Compra desde casa y recibe en el mismo día.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/products?category=supermercado" className="hover:text-white">
                  Supermercado
                </Link>
              </li>
              <li>
                <Link href="/products?category=electro" className="hover:text-white">
                  Electro
                </Link>
              </li>
              <li>
                <Link href="/products?category=hogar" className="hover:text-white">
                  Hogar
                </Link>
              </li>
              <li>
                <Link href="/products?category=moda" className="hover:text-white">
                  Moda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#" className="hover:text-white">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#" className="hover:text-white">
                  Facebook
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Instagram
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  YouTube
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Proyecto PlazaVea. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
