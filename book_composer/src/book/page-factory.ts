import type { Page, TemplateId } from "./types";
import { TEMPLATES } from "./templates";

let pageSequence = 0;

export function createEmptyPage(template: TemplateId, reference?: Page, stableId?: string): Page {
  return {
    id: stableId ?? `page-${Date.now().toString(36)}-${(pageSequence += 1)}`,
    template,
    variant: TEMPLATES[template].variants[0],
    part: reference?.part,
    chapter: reference?.chapter,
    title: "Nova página",
    settings: {
      header: true,
      footer: false,
      pageNumber: true,
      columns: TEMPLATES[template].defaultColumns,
      background: "paper",
      fullBleed: false,
    },
    blocks: [],
  };
}
