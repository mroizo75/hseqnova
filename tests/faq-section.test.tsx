import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import assert from "node:assert/strict";
import { FAQSection } from "../src/components/faq-section";

const sampleFaqs = [
  { question: "Hva er HMS Nova?", answer: "Et moderne HMS-system." },
];

test("FAQSection rendrer schema når enableSchema er true", () => {
  const html = renderToStaticMarkup(<FAQSection faqs={sampleFaqs} />);
  assert.ok(html.includes('"@type":"FAQPage"'), "FAQ schema mangler");
});

test("FAQSection skjuler schema når enableSchema er false", () => {
  const html = renderToStaticMarkup(
    <FAQSection faqs={sampleFaqs} enableSchema={false} />
  );
  assert.ok(!html.includes('"@type":"FAQPage"'), "FAQ schema skulle være skjult");
});


