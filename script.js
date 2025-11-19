const storageKey = 'wohnheim-tracker';
const memberForm = document.querySelector('#memberForm');
const memberInput = document.querySelector('#memberName');
const memberList = document.querySelector('#memberList');
const memberCount = document.querySelector('#memberCount');
const taskCount = document.querySelector('#taskCount');
const participantOptions = document.querySelector('#participantOptions');
const participantSearch = document.querySelector('#participantSearch');
const participantMatchCount = document.querySelector('#participantMatchCount');
const selectAllParticipantsBtn = document.querySelector('#selectAllParticipants');
const clearParticipantsBtn = document.querySelector('#clearParticipants');
const taskForm = document.querySelector('#taskForm');
const taskList = document.querySelector('#taskList');
const memberTemplate = document.querySelector('#memberTemplate');
const taskTemplate = document.querySelector('#taskTemplate');

let state = {
  members: [],
  tasks: []
};
let participantFilter = '';

const persist = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const hydrate = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    state = {
      members: parsed.members ?? [],
      tasks: parsed.tasks ?? []
    };
  } catch (error) {
    console.error('Konnte Daten nicht laden', error);
  }
};

const createId = () => crypto.randomUUID();

const formatDate = (date) =>
  new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const countForMember = (memberId) =>
  state.tasks.filter((task) => task.participants.includes(memberId)).length;

const renderMemberList = () => {
  memberList.innerHTML = '';
  const sorted = [...state.members].sort((a, b) =>
    a.name.localeCompare(b.name, 'de-DE', { sensitivity: 'base' })
  );

  const frag = document.createDocumentFragment();
  sorted.forEach((member) => {
    const card = memberTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('h3').textContent = member.name;
    card.querySelector('p').textContent = `${countForMember(member.id)} Einsätze`;
    const removeBtn = card.querySelector('button');
    removeBtn.addEventListener('click', () => deleteMember(member.id));
    frag.appendChild(card);
  });
  memberList.appendChild(frag);
  memberCount.textContent = state.members.length;
};

const updateParticipantControls = (hasMembers, visibleCount) => {
  if (participantSearch) {
    participantSearch.disabled = !hasMembers;
    participantSearch.value = hasMembers ? participantFilter : '';
  }

  const disableActions = !hasMembers || !visibleCount;
  [selectAllParticipantsBtn, clearParticipantsBtn].forEach((btn) => {
    if (!btn) return;
    btn.disabled = disableActions;
  });

  if (participantMatchCount) {
    participantMatchCount.textContent = hasMembers
      ? `Zeigt ${visibleCount} von ${state.members.length}`
      : '';
  }
};

const renderParticipantOptions = () => {
  const previouslySelected = new Set(
    Array.from(participantOptions.querySelectorAll('input:checked')).map(
      (input) => input.value
    )
  );

  participantOptions.innerHTML = '';

  if (!state.members.length) {
    participantFilter = '';
    updateParticipantControls(false, 0);
    const empty = document.createElement('p');
    empty.className = 'muted small';
    empty.textContent = 'Noch keine Mitglieder – lege zuerst Namen oben an.';
    participantOptions.appendChild(empty);
    return;
  }

  const normalizedFilter = participantFilter.trim().toLowerCase();
  const filteredMembers = [...state.members]
    .sort((a, b) => a.name.localeCompare(b.name, 'de-DE', { sensitivity: 'base' }))
    .filter((member) => member.name.toLowerCase().includes(normalizedFilter));

  updateParticipantControls(true, filteredMembers.length);

  if (!filteredMembers.length) {
    const empty = document.createElement('p');
    empty.className = 'muted small';
    empty.textContent = 'Keine Treffer für deine Suche.';
    participantOptions.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  filteredMembers.forEach((member) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'participants';
    checkbox.value = member.id;
    checkbox.checked = previouslySelected.has(member.id);
    label.append(checkbox, member.name);
    frag.appendChild(label);
  });
  participantOptions.appendChild(frag);
};

const renderTaskList = () => {
  taskList.innerHTML = '';
  if (!state.tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Noch keine Einträge. Erfasse den ersten Einsatz!';
    taskList.appendChild(empty);
    taskCount.textContent = '0';
    return;
  }

  const frag = document.createDocumentFragment();
  const sorted = [...state.tasks].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((task) => {
    const card = taskTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('h3').textContent = task.title;
    card.querySelector('p.small').textContent = formatDate(task.date);
    card.querySelector('.notes').textContent = task.notes || 'Keine Notizen';

    const participantBox = card.querySelector('.participants');
    if (task.participants.length) {
      task.participants.forEach((id) => {
        const member = state.members.find((m) => m.id === id);
        if (!member) return;
        const badge = document.createElement('span');
        badge.textContent = member.name;
        participantBox.appendChild(badge);
      });
    } else {
      const badge = document.createElement('span');
      badge.textContent = 'Noch niemand eingetragen';
      participantBox.appendChild(badge);
    }

    const deleteBtn = card.querySelector('button.ghost');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    const editForm = card.querySelector('.edit-form');
    state.members.forEach((member) => {
      const label = document.createElement('label');
      label.className = 'small';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = member.id;
      checkbox.checked = task.participants.includes(member.id);
      label.append(checkbox, member.name);
      editForm.appendChild(label);
    });

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Speichern';
    saveBtn.className = 'primary';
    saveBtn.addEventListener('click', () => {
      const selected = Array.from(
        editForm.querySelectorAll('input:checked')
      ).map((input) => input.value);
      updateTaskParticipants(task.id, selected);
    });
    editForm.appendChild(saveBtn);

    frag.appendChild(card);
  });

  taskList.appendChild(frag);
  taskCount.textContent = state.tasks.length;
};

const deleteMember = (memberId) => {
  if (!confirm('Mitglied wirklich entfernen? Die Einsatzhistorie bleibt erhalten.')) return;
  state.members = state.members.filter((member) => member.id !== memberId);
  state.tasks = state.tasks.map((task) => ({
    ...task,
    participants: task.participants.filter((id) => id !== memberId)
  }));
  persist();
  renderAll();
};

const deleteTask = (taskId) => {
  if (!confirm('Einsatz wirklich löschen?')) return;
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  persist();
  renderAll();
};

const updateTaskParticipants = (taskId, participantIds) => {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, participants: participantIds } : task
  );
  persist();
  renderAll();
};

memberForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = memberInput.value.trim();
  if (!name) return;
  state.members.push({ id: createId(), name });
  memberInput.value = '';
  persist();
  renderAll();
  memberInput.focus();
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!state.members.length) {
    alert('Lege zuerst Mitglieder an.');
    return;
  }

  const data = new FormData(taskForm);
  const task = {
    id: createId(),
    title: data.get('taskTitle').trim(),
    date: data.get('taskDate'),
    notes: data.get('taskNotes').trim(),
    participants: data.getAll('participants')
  };

  if (!task.title || !task.date) {
    alert('Bitte gib mindestens Titel und Datum an.');
    return;
  }

  state.tasks.push(task);
  taskForm.reset();
  participantFilter = '';
  taskForm.querySelector('[name="taskDate"]').valueAsDate = new Date();
  persist();
  renderAll();
});

const toggleAllParticipants = (checked) => {
  participantOptions
    .querySelectorAll('input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = checked;
    });
};

participantSearch?.addEventListener('input', (event) => {
  participantFilter = event.target.value;
  renderParticipantOptions();
});

selectAllParticipantsBtn?.addEventListener('click', () => toggleAllParticipants(true));
clearParticipantsBtn?.addEventListener('click', () => toggleAllParticipants(false));

const renderAll = () => {
  renderMemberList();
  renderParticipantOptions();
  renderTaskList();
};

const init = () => {
  hydrate();
  taskForm.querySelector('[name="taskDate"]').valueAsDate = new Date();
  renderAll();
};

init();
