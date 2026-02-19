import React, { useState, useEffect } from "react";
import "./Carousel.css";
import { ASSETS_BASE } from "../config/api";

interface CarouselItem {
  id_evento: number;
  titulo: string;
  descricao?: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
}

/**
 * Componente de Carrossel
 * Exibe imagens de eventos em um carrossel com navegação manual e automática
 */
const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, items.length, autoPlayInterval]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + items.length) % items.length
    );
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (items.length === 0) {
    return (
      <div className="carousel-empty">
        <p>Nenhum evento disponível no momento</p>
      </div>
    );
  }

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div key={item.id_evento} className="carousel-slide">
              <img
                src={`${ASSETS_BASE}${item.imagem_url}`}
                alt={item.titulo}
                className="carousel-image"
                loading="lazy"
              />
              <div className="carousel-overlay">
                <h3 className="carousel-title">{item.titulo}</h3>
                {item.descricao && (
                  <p className="carousel-description">{item.descricao}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <button
              className="carousel-button carousel-button-prev"
              onClick={goToPrevious}
              aria-label="Slide anterior"
            >
              ‹
            </button>
            <button
              className="carousel-button carousel-button-next"
              onClick={goToNext}
              aria-label="Próximo slide"
            >
              ›
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${
                index === currentIndex ? "active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
