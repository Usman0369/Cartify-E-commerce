import {
  ReturnIcon,
  ShieldIcon,
  SupportIcon,
  TruckIcon,
} from './Icons.jsx'
import SectionHeading from './SectionHeading.jsx'
import './Benefits.css'

const benefits = [
  {
    icon: TruckIcon,
    title: 'Free shipping',
    description:
      'Complimentary delivery on orders over $75, packed with care and sent within one working day.',
  },
  {
    icon: ShieldIcon,
    title: 'Secure checkout',
    description:
      'Every payment is encrypted and protected, so checkout stays simple and worry-free.',
  },
  {
    icon: ReturnIcon,
    title: 'Easy 30-day returns',
    description:
      'Changed your mind? Send it back within 30 days for a full refund, no questions asked.',
  },
  {
    icon: SupportIcon,
    title: 'Real human support',
    description:
      'A small team ready to help with sizing, delivery, or anything else — seven days a week.',
  },
]

function Benefits() {
  return (
    <section className="section benefits">
      <div className="container">
        <SectionHeading
          eyebrow="Why Cartify"
          title="A calmer way to shop"
          description="Thoughtful details at every step, from the products we choose to the way they arrive at your door."
        />

        <div className="benefits__grid">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article className="benefit-card" key={title}>
              <span className="benefit-card__icon" aria-hidden="true">
                <Icon />
              </span>
              <h3 className="benefit-card__title">{title}</h3>
              <p className="benefit-card__description">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits
