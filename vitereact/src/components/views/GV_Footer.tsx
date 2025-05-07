import React from "react";
import { Link, useNavigate } from "react-router-dom";

const GV_Footer: React.FC = () => {
  // Default state values from the datamap
  const footer_links = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Contact", href: "/contact" }
  ];
  
  const company_info = { text: "© Appointment Booking System 2023. All rights reserved." };
  
  const social_media_links = [
    { platform: "Facebook", href: "https://facebook.com", iconUrl: "https://picsum.photos/30" },
    { platform: "Twitter", href: "https://twitter.com", iconUrl: "https://picsum.photos/31" }
  ];

  const navigate = useNavigate();

  // Handle footer link click action. It navigates to the corresponding URL.
  const handleFooterLinkClick = (href: string) => {
    navigate(href);
  };

  // Single big render block returning the footer layout
  return (
    <>
      <footer className="bg-gray-800 text-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Footer Navigation Links */}
            <div className="mb-4 md:mb-0">
              <ul className="flex space-x-4">
                {footer_links.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.href} 
                      onClick={() => handleFooterLinkClick(link.href)}
                      className="hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Company Information */}
            <div className="mb-4 md:mb-0">
              <span>{company_info.text}</span>
            </div>
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              {social_media_links.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <img 
                    src={social.iconUrl} 
                    alt={social.platform} 
                    className="w-6 h-6"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;