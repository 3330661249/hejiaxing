import { AILabSection } from './components/AILabSection';
import { BackgroundVideo } from './components/BackgroundVideo';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { ContactSection } from './components/ContactSection';
import { CustomCursor } from './components/CustomCursor';
import { ExperienceSection } from './components/ExperienceSection';
import { HeroSection } from './components/HeroSection';
import { ProjectIndex } from './components/ProjectIndex';
import { ProjectSection } from './components/ProjectSection';
import { SiteHeader } from './components/SiteHeader';
import { projects } from './content/resume';

export default function App() {
  return (
    <>
      <BackgroundVideo />
      <CustomCursor />
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <SiteHeader mainId="main-content" />

      <div className="site-content">
        <main id="main-content">
          <HeroSection />
          <ProjectIndex />
          {projects.map((project) => (
            <ProjectSection key={project.id} project={project} />
          ))}
          <ExperienceSection />
          <AILabSection />
          <CapabilitiesSection />
        </main>
        <ContactSection />
      </div>
    </>
  );
}
