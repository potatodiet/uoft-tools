import { browser } from "webextension-polyfill-ts";
import { ProfessorInfo } from "./rate_my_prof_api";

class TimetableStg {
  constructor() {
    let observer = new MutationObserver(() => {
      this.getCourses().forEach(async el => {
        const name = this.getProfName(el);
        if (name !== '—') {
          const profInfo = await browser.runtime.sendMessage({
            "getProfInfo": { name: name, schoolId: "1484" }
          });
          if (profInfo != null) {
            el.appendChild(this.createHeaderField());
            el.appendChild(this.createInfoField(profInfo));
          }
        }
      });
    });

    const coursesEl = document.querySelector('#courses')!;
    observer.observe(coursesEl, { childList: true });
  }

  private getCourses(): NodeListOf<HTMLElement> {
    let rawCourses: NodeListOf<HTMLElement> = document.querySelectorAll('#courses .perMeeting tbody');
    return rawCourses;
  }

  private createInfoField(profInfo: ProfessorInfo): HTMLElement {
    let tr = document.createElement('tr');
    tr.className = 'sectionData';

    let td1 = document.createElement('td');
    td1.className = 'colEnrol';
    td1.innerText = profInfo.overallQuality;

    let td2 = document.createElement('td');
    td2.className = 'colEnrol';
    td2.innerText = profInfo.wouldTakeAgain;

    let td3 = document.createElement('td');
    td3.className = 'colEnrol';
    td3.innerText = profInfo.levelOfDifficulty;

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);

    return tr;
  }

  private createHeaderField(): HTMLElement {
    let tr = document.createElement('tr');
    tr.className = 'sectionHead';

    let td1 = document.createElement('td');
    td1.className = 'sectionData';
    td1.innerText = 'Overall Quality';

    let td2 = document.createElement('td');
    td2.className = 'sectionData';
    td2.innerText = 'Would Take Again';

    let td3 = document.createElement('td');
    td3.className = 'sectionData';
    td3.innerText = 'Level of Difficulty';

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);

    return tr;
  }

  private getProfName(el: Element): string {
    const instructor = el.querySelector('.colInst') as HTMLElement;
    return instructor.innerText.trim();
  }
}

new TimetableStg();
