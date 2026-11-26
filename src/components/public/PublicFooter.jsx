import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';
import { DEFAULT_FOOTER_LINKS, parseFooterLinks } from '@/lib/websiteSettings';

const DEFAULT_NARASI =
  'Website resmi Pemerintah Desa Tagog Apu, Kecamatan Padalarang, Kabupaten Bandung Barat, Provinsi Jawa Barat.';

export default function PublicFooter() {
  const { settings } = useWebsiteSettings();
  const savedLinks = parseFooterLinks(settings.footer_links);
  const links = savedLinks.length > 0 ? savedLinks : DEFAULT_FOOTER_LINKS;
  const narasi = settings.footer_narasi || DEFAULT_NARASI;
  const copyright =
    settings.footer_copyright ||
    `© ${new Date().getFullYear()} Pemerintah Desa Tagog Apu. Dikelola oleh SIMDESTA (Sistem Informasi Manajemen Desa Terintegrasi).`;

  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <Image src={settings.logo_url} alt="Logo Desa" className="w-full h-full" fittingType="fit" />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Desa Tagog Apu</h3>
                <p className="text-xs text-primary-foreground/60">Pemerintah Desa Tagog Apu</p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">{narasi}</p>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-primary-foreground/90">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm">
              {links.map((link, index) => (
                <li key={`${link.url}-${index}`}>
                  {/^https?:\/\//i.test(link.url) ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-foreground/70 hover:text-accent transition-colors"
                    >
                      {link.label || link.url}
                    </a>
                  ) : (
                    <Link to={link.url || '/'} className="text-primary-foreground/70 hover:text-accent transition-colors">
                      {link.label || link.url}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-primary-foreground/90">Kontak</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              {settings.footer_alamat && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent" />
                  <span className="whitespace-pre-line">{settings.footer_alamat}</span>
                </li>
              )}
              {settings.footer_telepon && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span>{settings.footer_telepon}</span>
                </li>
              )}
              {settings.footer_email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span>{settings.footer_email}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent" />
                <span className="whitespace-pre-line">Kantor Desa Tagog Apu, Kec. Padalarang, Kab. Bandung Barat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-primary-foreground/50">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}