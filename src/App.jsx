import { useEffect, useState } from 'react';
import '../css/bootstrap.min.css';
import '../lib/animate/animate.min.css';
import '../css/style.css';
import defaultContent from '../shared/defaultContent.js';
import AdminPanel from './AdminPanel.jsx';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/service' },
  { label: "Owner's", path: '/owners' },
  { label: 'Contact', path: '/contact' },
];

function normalizePath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const aliases = {
    '/index.html': '/',
    '/about.html': '/about',
    '/service.html': '/service',
    '/owners.html': '/owners',
    '/contact.html': '/contact',
  };
  return aliases[path] || path;
}

function InternalLink({ to, navigate, className, children, ...props }) {
  const external = /^(https?:|mailto:|tel:)/i.test(to);

  return (
    <a
      href={to}
      className={className}
      onClick={external ? undefined : (event) => {
        event.preventDefault();
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

function Topbar({ content }) {
  const socialLinks = content.socialLinks;

  return (
    <div className="container-fluid bg-dark px-0">
      <div className="row g-0 d-none d-lg-flex">
        <div className="col-lg-6 ps-5 text-start">
          <div className="h-100 d-inline-flex align-items-center text-white">
            <span>Follow Us:</span>
            <a className="btn btn-link text-light" href={socialLinks.younas} title="MD.Younas"><i className="fab fa-whatsapp" /></a>
            <a className="btn btn-link text-light" href={socialLinks.shakeel} title="MD.Shakeel"><i className="fab fa-whatsapp" /></a>
          </div>
        </div>
        <div className="col-lg-6 text-end">
          <div className="h-100 topbar-right d-inline-flex align-items-center text-white py-2 px-5">
            <span className="fs-5 fw-bold me-2"><i className="fa fa-phone-alt me-2" />Call Us:</span>
            <span className="fs-5 fw-bold">{content.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ activePath, navigate, scrolled, content }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [activePath]);

  return (
    <nav
      className={['navbar navbar-expand-lg bg-white navbar-light sticky-top py-0 pe-5', scrolled ? 'shadow-sm' : '', open ? 'nav-open' : ''].join(' ')}
      style={{ top: scrolled ? '0px' : '-100px' }}
    >
      <InternalLink to="/" navigate={navigate} className="navbar-brand ps-5 me-0">
        <h1 className="text-white m-0">{content.brandName}</h1>
      </InternalLink>
      <button
        type="button"
        className="navbar-toggler me-0"
        aria-expanded={open}
        aria-controls="navbarCollapse"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="navbar-toggler-icon" />
      </button>
      <div className={['collapse navbar-collapse', open ? 'show' : ''].join(' ')} id="navbarCollapse">
        <div className="navbar-nav ms-auto p-4 p-lg-0">
          {navItems.map((item) => (
            <InternalLink
              key={item.path}
              to={item.path}
              navigate={navigate}
              className={['nav-item nav-link', activePath === item.path ? 'active' : ''].join(' ')}
            >
              {item.label}
            </InternalLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Footer({ navigate, content }) {
  const socialLinks = content.socialLinks;

  const quickLinks = [
    ['About Us', '/about'],
    ['Contact Us', '/contact'],
    ['Our Services', '/service'],
    ['Owners', '/owners'],
  ];

  return (
    <>
      <div className="container-fluid bg-dark footer mt-5 py-5 wow fadeIn" data-wow-delay="0.1s">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <h5 className="text-white mb-4">Our Office</h5>
              <p className="mb-2"><i className="fa fa-map-marker-alt me-3" />{content.office.address}</p>
              <p className="mb-2"><i className="fa fa-phone-alt me-3" />{content.phone}</p>
              <p className="mb-2"><i className="fa fa-envelope me-3" />{content.office.email}</p>
              <div className="d-flex pt-3">
                <a className="btn btn-square btn-primary rounded-circle me-2" href={socialLinks.younas} title="MD.Younas"><i className="fab fa-whatsapp" /></a>
                <a className="btn btn-square btn-primary rounded-circle me-2" href={socialLinks.shakeel} title="MD.Shakeel"><i className="fab fa-whatsapp" /></a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h5 className="text-white mb-4">Quick Links</h5>
              {quickLinks.map(([label, path]) => (
                <InternalLink key={path} to={path} navigate={navigate} className="btn btn-link">{label}</InternalLink>
              ))}
            </div>
            <div className="col-lg-3 col-md-6">
              <h5 className="text-white mb-4">Office Time</h5>
            <p className="mb-1">{content.office.days}</p>
            <h6 className="text-light">{content.office.hours}</h6>
            <p className="mb-1">{content.office.closedDay}</p>
            <h6 className="text-light">{content.office.closedText}</h6>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid copyright bg-dark py-4">
        <div className="container text-center">
          <p className="mb-2">Copyright &copy; <a className="fw-semi-bold" href={socialLinks.younas}>{content.brandName}</a>, All Right Reserved.</p>
          <p className="mb-0">Developed By <a className="fw-semi-bold" href="https://ngl.link/mh_hamza">MH Hamza Younas</a></p>
        </div>
      </div>
    </>
  );
}

function Layout({ activePath, navigate, children, content }) {
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1);
    const onScroll = () => {
      setScrolled(window.scrollY > 300);
      setShowTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div id="spinner" className={[loading ? 'show' : '', 'bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center'].join(' ')}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
      </div>
      <Topbar content={content} />
      <Navbar activePath={activePath} navigate={navigate} scrolled={scrolled} content={content} />
      {children}
      <Footer navigate={navigate} content={content} />
      <button
        type="button"
        className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"
        style={{ display: showTop ? 'inline-flex' : 'none' }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <i className="bi bi-arrow-up" />
      </button>
    </>
  );
}

function PageHeader({ title, breadcrumbs, navigate }) {
  return (
    <div className="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
      <div className="container py-5">
        <h1 className="display-3 text-white animated slideInRight">{title}</h1>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb animated slideInRight mb-0">
            {breadcrumbs.map((breadcrumb, index) => (
              <li
                key={breadcrumb.label + '-' + index}
                className={['breadcrumb-item', breadcrumb.active ? 'active' : ''].join(' ')}
                aria-current={breadcrumb.active ? 'page' : undefined}
              >
                {breadcrumb.active ? breadcrumb.label : (
                  <InternalLink to={breadcrumb.path} navigate={navigate}>{breadcrumb.label}</InternalLink>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}

function Facts({ stats = defaultContent.stats }) {
  return (
    <div className="container-fluid facts my-5 p-5">
      <div className="row g-5">
        {stats.map(({ icon, value, label }, index) => (
          <div className="col-md-6 col-xl-3 wow fadeIn" data-wow-delay={'0.' + (index * 2 + 1) + 's'} key={label}>
            <div className="text-center border p-5">
              <i className={['fa', icon, 'fa-3x text-white mb-3'].join(' ')} />
              <h1 className="display-2 text-primary mb-0">{value}</h1>
              <span className="fs-5 fw-semi-bold text-white">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnersSection({ owners = defaultContent.owners }) {
  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mx-auto wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '600px' }}>
          <p className="fw-medium text-uppercase text-primary mb-2">Owner&apos;s</p>
          <h1 className="display-5 mb-5">Companies Owner&apos;s</h1>
        </div>
        <div className="row g-4">
          {owners.map(({ image, name, role, whatsapp }, index) => (
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={'0.' + (index * 2 + 1) + 's'} key={name}>
              <div className="team-item">
                <img className="img-fluid" src={'/img/' + image} alt="" />
                <div className="d-flex">
                  <div className="flex-shrink-0 btn-square bg-primary" style={{ width: '90px', height: '90px' }}>
                    <i className="fa fa-2x fa-share text-white" />
                  </div>
                  <div className="position-relative overflow-hidden bg-light d-flex flex-column justify-content-center w-100 ps-4" style={{ height: '90px' }}>
                    <h5>{name}</h5>
                    <span className="text-primary">{role}</span>
                    <div className="team-social">
                      <a className="btn btn-square btn-dark rounded-circle mx-1" href={whatsapp}><i className="fab fa-whatsapp" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesSection({ services = defaultContent.services }) {
  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mx-auto pb-4 wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '600px' }}>
          <p className="fw-medium text-uppercase text-primary mb-2">Our Services</p>
          <h1 className="display-5 mb-4">We Provide Best Services</h1>
        </div>
        <div className="row gy-5 gx-4">
          {services.map(({ image, title, description }, index) => (
            <div className="col-md-6 col-lg-4 wow fadeInUp" data-wow-delay={'0.' + (index * 2 + 1) + 's'} key={title}>
              <div className="service-item">
                <img className="img-fluid" src={'/img/' + image} alt="" />
                <div className="service-img"><img className="img-fluid" src={'/img/' + image} alt="" /></div>
                <div className="service-detail">
                  <div className="service-title">
                    <hr className="w-25" />
                    <h3 className="mb-0">{title}</h3>
                    <hr className="w-25" />
                  </div>
                  <div className="service-text"><p className="text-white mb-0">{description}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeCarousel({ navigate, slides = defaultContent.heroSlides, experience }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((value) => (value + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container-fluid px-0 mb-5">
      <div id="header-carousel" className="carousel slide">
        <div className="carousel-inner">
          {slides.map(({ image, text, cta, link }, index) => (
            <div className={['carousel-item', current === index ? 'active' : ''].join(' ')} key={image + '-' + index}>
              <img className="w-100" src={'/img/' + image} alt="Image" />
              <div className="carousel-caption">
                <div className="container">
                  <div className="row justify-content-center">
                    <div className="col-lg-10 text-start">
                      <p className="fs-5 fw-medium text-primary text-uppercase animated slideInRight">{experience} Years of Working Experience</p>
                      <h1 className="display-5 text-white mb-5 animated slideInRight">{text}</h1>
                      <InternalLink to={link} navigate={navigate} className="btn btn-primary py-3 px-5 animated slideInRight">{cta}</InternalLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="carousel-control-prev" type="button" onClick={() => setCurrent((current + slides.length - 1) % slides.length)}>
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" onClick={() => setCurrent((current + 1) % slides.length)}>
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
}

function FeaturesSection({ features = defaultContent.features }) {
  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.1s">
            <div className="position-relative me-lg-4">
              <img className="img-fluid w-100" src="/img/feature.jpg" alt="" />
              <span className="position-absolute top-50 start-100 translate-middle bg-white rounded-circle d-none d-lg-block" style={{ width: '120px', height: '120px' }} />
            </div>
          </div>
          <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.5s">
            <p className="fw-medium text-uppercase text-primary mb-2">Why Choosing Us!</p>
            <h1 className="display-5 mb-4">Few Reasons Why People Choosing Us!</h1>
            <p className="mb-4">Certified expertise : our team consists of highly skilled certified welders and fabricators fitters with year of hands on experience across industrial commercial and custom projects Quality without compromise Complete solution under one roof</p>
            <div className="row gy-4">
              {features.map(({ title, description }) => (
                <div className="col-12" key={title}>
                  <div className="d-flex">
                    <div className="flex-shrink-0 btn-lg-square rounded-circle bg-primary"><i className="fa fa-check text-white" /></div>
                    <div className="ms-4"><h4>{title}</h4><span>{description}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ navigate, content }) {
  return (
    <>
      <HomeCarousel navigate={navigate} slides={content.heroSlides} experience={content.stats[0]?.value || ''} />
      <FeaturesSection features={content.features} />
      <Facts stats={content.stats} />
      <ServicesSection services={content.services} />
      <OwnersSection owners={content.owners} />
    </>
  );
}

function AboutPage({ navigate, content }) {
  return (
    <>
      <PageHeader
        title="About Us"
        navigate={navigate}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Services', path: '/service' },
          { label: 'About Us', active: true },
        ]}
      />
      <Facts stats={content.stats} />
      <OwnersSection owners={content.owners} />
    </>
  );
}

function ServicePage({ navigate, content }) {
  return (
    <>
      <PageHeader
        title="Services"
        navigate={navigate}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'About Us', path: '/about' },
          { label: 'Services', active: true },
        ]}
      />
      <ServicesSection services={content.services} />
    </>
  );
}

function OwnersPage({ navigate, content }) {
  return (
    <>
      <PageHeader
        title="Owners"
        navigate={navigate}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'About Us', path: '/about' },
          { label: 'Owners', active: true },
        ]}
      />
      <OwnersSection owners={content.owners} />
    </>
  );
}

function ContactPage({ navigate, content }) {
  const contact = content.contact;
  const socialLinks = content.socialLinks;
  const primaryEmail = contact.emails[0] || content.office.email;
  const primaryWhatsapp = socialLinks.younas;
  return (
    <>
      <PageHeader
        title="Contact"
        navigate={navigate}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Services', path: '/service' },
          { label: 'Contact', active: true },
        ]}
      />
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row g-5 justify-content-center mb-5">
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="bg-light text-center h-100 p-5">
                <div className="btn-square bg-white rounded-circle mx-auto mb-4" style={{ width: '90px', height: '90px' }}><i className="fab fa-whatsapp fa-2x text-success" title="Chat on WhatsApp" /></div>
                <h4 className="mb-3">Whatsapp Number</h4>
                <p className="mb-2">{contact.whatsappNumbers[0]}</p>
                <p className="mb-4">{contact.whatsappNumbers[1]}</p>
                <a className="btn btn-primary px-4" href={primaryWhatsapp}>Chat Now <i className="fa fa-arrow-right ms-2" /></a>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="bg-light text-center h-100 p-5">
                <div className="btn-square bg-white rounded-circle mx-auto mb-4" style={{ width: '90px', height: '90px' }}><i className="fa fa-envelope fa-2x text-danger" title="Send us an email" /></div>
                <h4 className="mb-3">Email Address</h4>
                <p className="mb-2">{contact.emails[0]}</p>
                <p className="mb-4">{contact.emails[1]}</p>
                <a className="btn btn-primary px-4" href={'mailto:' + primaryEmail}>Email Now <i className="fa fa-arrow-right ms-2" /></a>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
              <div className="bg-light text-center h-100 p-5">
                <div className="btn-square bg-white rounded-circle mx-auto mb-4" style={{ width: '90px', height: '90px' }}><i className="fa fa-map-marker-alt fa-2x text-primary" title="Our Location" /></div>
                <h4 className="mb-3">Office Address</h4>
                <p className="mb-2">{contact.officePhones[0]}</p>
                <p className="mb-4">{contact.officePhones[1]}</p>
                <a className="btn btn-primary px-4" href={contact.directionUrl} target="_blank" rel="noreferrer">Direction <i className="fa fa-arrow-right ms-2" /></a>
              </div>
            </div>
          </div>
          <div className="row mb-5">
            <div className="col-12 wow fadeInUp" data-wow-delay="0.1s">
              <iframe
                className="w-100"
                title="MYGM Group Office Location"
                src={contact.mapEmbedUrl}
                frameBorder="0"
                style={{ minHeight: '450px', border: 0 }}
                allowFullScreen
                aria-hidden="false"
                tabIndex="0"
              />
            </div>
          </div>
          <div className="row g-5">
            <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.1s">
              <p className="fw-medium text-uppercase text-primary mb-2">Contact Us</p>
              <h1 className="display-5 mb-4">If You Have Any Queries, Please Feel Free To Contact Us</h1>
              <p className="mb-4">If you have any questions or concerns, feel free to reach out to us anytime.</p>
              <div className="row g-4">
                <div className="col-6"><div className="d-flex"><div className="flex-shrink-0 btn-square bg-primary rounded-circle"><i className="fa fa-phone-alt text-white" /></div><div className="ms-3"><h6>Call Us</h6><span>{content.phone}</span></div></div></div>
                <div className="col-6"><div className="d-flex"><div className="flex-shrink-0 btn-square bg-primary rounded-circle"><i className="fa fa-envelope text-white" /></div><div className="ms-3"><h6>Mail Us</h6><span>{content.office.email}</span></div></div></div>
              </div>
            </div>
            <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.5s" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(normalizePath(window.location.pathname));
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    fetch('/api/site-content')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setContent(data);
      })
      .catch(() => {
        // The default content keeps the site usable when the API is offline.
      });
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPathname(normalizePath(to));
  };

  const pages = {
    '/': <HomePage navigate={navigate} content={content} />,
    '/about': <AboutPage navigate={navigate} content={content} />,
    '/service': <ServicePage navigate={navigate} content={content} />,
    '/owners': <OwnersPage navigate={navigate} content={content} />,
    '/contact': <ContactPage navigate={navigate} content={content} />,
  };

  if (pathname === '/admin') {
    return <AdminPanel />;
  }

  return <Layout activePath={pathname} navigate={navigate} content={content}>{pages[pathname] || pages['/']}</Layout>;
}
