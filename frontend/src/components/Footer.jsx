import { Link } from 'react-router-dom'
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  XIcon,
} from './Icons.jsx'
import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link className="footer__logo" to="/" aria-label="Cartify home">
              <span className="footer__mark" aria-hidden="true">
                C
              </span>
              <span>Cartify</span>
            </Link>
            <p className="footer__blurb">
              Considered essentials for everyday living. Curated with care,
              delivered with a little more thought.
            </p>
            <div className="footer__socials">
              <Link to="/contact" aria-label="Cartify on Instagram">
                <InstagramIcon />
              </Link>
              <Link to="/contact" aria-label="Cartify on Facebook">
                <FacebookIcon />
              </Link>
              <Link to="/contact" aria-label="Cartify on X">
                <XIcon />
              </Link>
            </div>
          </div>

          <div className="footer__column">
            <h3>Shop</h3>
            <ul>
              <li>
                <Link to="/shop">All products</Link>
              </li>
              <li>
                <Link to="/categories">Categories</Link>
              </li>
              <li>
                <Link to="/best-sellers">Best sellers</Link>
              </li>
              <li>
                <Link to="/shop?sort=newest">New arrivals</Link>
              </li>
            </ul>
          </div>

          <div className="footer__column">
            <h3>Help</h3>
            <ul>
              <li>
                <Link to="/contact">Contact us</Link>
              </li>
              <li>
                <Link to="/contact">Shipping &amp; returns</Link>
              </li>
              <li>
                <Link to="/contact">Track an order</Link>
              </li>
              <li>
                <Link to="/contact">FAQs</Link>
              </li>
            </ul>
          </div>

          <div className="footer__column footer__contact">
            <h3>Get in touch</h3>
            <ul>
              <li>
                <a href="mailto:hello@cartify.shop">
                  <MailIcon />
                  hello@cartify.shop
                </a>
              </li>
              <li>
                <a href="tel:+15550142890">
                  <PhoneIcon />
                  +1 (555) 014-2890
                </a>
              </li>
              <li>
                <span>
                  <PinIcon />
                  24 Alder Lane, Portland, OR
                </span>
              </li>
            </ul>
            <p className="footer__hours">Mon–Sun · 9am to 6pm PT</p>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {year} Cartify. All rights reserved.</p>
          <div className="footer__legal">
            <Link to="/contact">Privacy policy</Link>
            <Link to="/contact">Terms of service</Link>
          </div>
          <div className="footer__payments" aria-label="Accepted payment methods">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
