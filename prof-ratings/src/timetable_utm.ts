import { browser } from "webextension-polyfill-ts";
import { ProfessorInfo } from "./rate_my_prof_api";

class TimetableUtm {
  constructor() {
    let observer = new MutationObserver(() => {
      this.getCourses().forEach(async el => {
        const name = this.getProfName(el);
        if (name !== '—' && name !== '') {
          const profInfo = await browser.runtime.sendMessage({
            "getProfInfo": { name: name, schoolId: "12184" }
          });
          if (profInfo != null) {
            el.parentNode!.insertBefore(this.createInfoField(profInfo), el.nextSibling);
            el.parentNode!.insertBefore(this.createHeaderField(), el.nextSibling);
          }
        }
      });
    });

    const coursesEl = document.querySelector('#ttContent')!;
    observer.observe(coursesEl, { childList: true });
  }

  private getCourses(): NodeListOf<HTMLElement> {
    return document.querySelectorAll('#ttContent .course tbody tr');
  }

  private createInfoField(profInfo: ProfessorInfo): HTMLElement {
    let tr = document.createElement('tr');
    tr.className = 'sectionData';

    let td1 = document.createElement('td');
    td1.innerText = profInfo.overallQuality;

    let td2 = document.createElement('td');
    td2.innerText = profInfo.wouldTakeAgain;

    let td3 = document.createElement('td');
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
    const instructor = el.querySelector('.instrTD') as HTMLElement;
    return instructor.innerText.trim();
  }
}

new TimetableUtm();
