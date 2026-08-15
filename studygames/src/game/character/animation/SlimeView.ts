// Builds the slime's DOM structure once. All animations mutate the transforms
// of these elements — never recreate them. Shared visual scaffolding.

export class SlimeView {
  readonly root: HTMLElement;
  readonly shadow: HTMLElement;
  readonly shadowFar: HTMLElement;
  readonly bodyGroup: HTMLElement;
  readonly lean: HTMLElement;
  readonly bounce: HTMLElement;
  readonly squash: HTMLElement;
  readonly body: HTMLElement;
  readonly leftPupil: HTMLElement;
  readonly rightPupil: HTMLElement;
  readonly leftEyelid: HTMLElement;
  readonly rightEyelid: HTMLElement;
  // Hat mount point: child of bounce (sibling of squash) so the hat bounces
  // and leans with the slime but is NOT squashed/stretched.
  readonly hatContainer: HTMLElement;
  // Zzz bubbles for the sleeping animation. Pool of 3 reusable elements.
  readonly sleepBubbles: HTMLElement[];
  private slimeType: string;

  constructor(type = 'nature') {
    this.root = document.createElement('div');
    this.root.className = 'slime-root';

    this.shadow = document.createElement('div');
    this.shadow.className = 'slime-shadow';
    this.shadowFar = document.createElement('div');
    this.shadowFar.className = 'slime-shadow-far';

    this.bodyGroup = document.createElement('div');
    this.bodyGroup.className = 'slime-body-group';

    this.lean = document.createElement('div');
    this.lean.className = 'slime-lean';
    this.bounce = document.createElement('div');
    this.bounce.className = 'slime-bounce';
    this.squash = document.createElement('div');
    this.squash.className = 'slime-squash';
    this.hatContainer = document.createElement('div');
    this.hatContainer.className = 'slime-hat-container';

    this.slimeType = type;
    this.body = document.createElement('div');
    this.body.className = `slime-body type-${type}`;

    const highlight = document.createElement('div');
    highlight.className = 'slime-highlight';

    const leftEye = document.createElement('div');
    leftEye.className = 'slime-eye slime-eye-left';
    this.leftPupil = document.createElement('div');
    this.leftPupil.className = 'slime-pupil';
    leftEye.appendChild(this.leftPupil);

    const rightEye = document.createElement('div');
    rightEye.className = 'slime-eye slime-eye-right';
    this.rightPupil = document.createElement('div');
    this.rightPupil.className = 'slime-pupil';
    rightEye.appendChild(this.rightPupil);

    // Eyelids — closed by sleep animation, hidden otherwise.
    this.leftEyelid = document.createElement('div');
    this.leftEyelid.className = 'slime-eyelid';
    this.leftEyelid.style.opacity = '0';
    leftEye.appendChild(this.leftEyelid);
    this.rightEyelid = document.createElement('div');
    this.rightEyelid.className = 'slime-eyelid';
    this.rightEyelid.style.opacity = '0';
    rightEye.appendChild(this.rightEyelid);

    const mouth = document.createElement('div');
    mouth.className = 'slime-mouth';

    this.body.appendChild(highlight);
    this.body.appendChild(leftEye);
    this.body.appendChild(rightEye);
    this.body.appendChild(mouth);

    this.squash.appendChild(this.body);
    this.bounce.appendChild(this.squash);
    this.bounce.appendChild(this.hatContainer);
    this.lean.appendChild(this.bounce);
    this.bodyGroup.appendChild(this.lean);
    this.root.appendChild(this.shadow);
    this.root.appendChild(this.shadowFar);
    this.root.appendChild(this.bodyGroup);

    this.sleepBubbles = [];
    for (let i = 0; i < 3; i++) {
      const zzz = document.createElement('div');
      zzz.className = 'slime-zzz';
      zzz.textContent = 'Z';
      zzz.style.opacity = '0';
      this.root.appendChild(zzz);
      this.sleepBubbles.push(zzz);
    }
  }

  get type(): string {
    return this.slimeType;
  }

  setSlimeType(type: string) {
    this.slimeType = type;
    this.body.className = `slime-body type-${type}`;
    this.root.dataset.slimeType = type;
  }
}
