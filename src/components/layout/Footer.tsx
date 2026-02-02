import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Verto</span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              Social swapping for remote workers. Exchange stays, build trust, and explore the world without paying rent twice.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/explore" className="text-gray-600 hover:text-primary transition-colors">
                  Explore stays
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-primary transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/trust" className="text-gray-600 hover:text-primary transition-colors">
                  Trust & safety
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-primary transition-colors">
                  Help center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-primary transition-colors">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            &copy; {new Date().getFullYear()} Verto. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
