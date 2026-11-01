import './SectionHeading.css'

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div className="section-heading__text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="section-heading__title">{title}</h2>
        {description && (
          <p className="section-heading__description">{description}</p>
        )}
      </div>
      {action && <div className="section-heading__action">{action}</div>}
    </div>
  )
}

export default SectionHeading
