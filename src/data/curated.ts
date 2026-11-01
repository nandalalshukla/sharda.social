import NOTES_2 from "./notes/2ndSem";
import NOTES_4 from "./notes/4thSem";
import NOTES_5 from "./notes/5thSem";
import NOTES_6 from "./notes/6thSem";
import NOTES_8 from "./notes/8thSem";
import SYLLABUS_2 from "./syllabus/2ndSem";
import SYLLABUS_4 from "./syllabus/4thSem";
import SYLLABUS_5 from "./syllabus/5thSem";
import SYLLABUS_6 from "./syllabus/6thSem";

/**
 * The hand-curated B.Tech CS lists the website ships with — identical data,
 * copied from the site's `DATA/` folder. The files themselves are served by
 * the website (`resolveFileUrl` turns the `src` paths into URLs).
 */
export interface CuratedItem {
  subject: string;
  code: string;
  credits: number;
  semester: number;
  year: string;
  src: string | string[];
}

export const CURATED_NOTES: CuratedItem[] = [
  ...NOTES_2,
  ...NOTES_4,
  ...NOTES_5,
  ...NOTES_6,
  ...NOTES_8,
];

export const CURATED_SYLLABUS: CuratedItem[] = [
  ...SYLLABUS_2,
  ...SYLLABUS_4,
  ...SYLLABUS_5,
  ...SYLLABUS_6,
];

export const CURATED_PROGRAM = "B.Tech CS";
