import './PageIntro.css'

function PageIntro({ eyebrow, title, description, actions }) {
  return (
    <section className="page-intro">
      <div className="container page-intro__inner">
        <div className="page-intro__content">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="page-intro__title">{title}</h1>
          {description && (
            <p className="page-intro__description">{description}</p>
          )}
        </div>

        {actions && <div className="page-intro__actions">{actions}</div>}
      </div>
    </section>
  )
}

export default PageIntro
