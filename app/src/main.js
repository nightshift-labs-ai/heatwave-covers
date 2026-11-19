// HEATWAVE Cover Studio: boots the editor shell (header, step strip, preview canvas).
export function bootHeatwaveStudio() {
  const canvas = document.getElementById('cover-preview');
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#2a0f45');
  sky.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  document.querySelector('.step-strip li[data-step="1"]').classList.add('active');
}

bootHeatwaveStudio();
