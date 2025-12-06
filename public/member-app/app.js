// Member App Logic for Dashboard
const api = new MemberAPI();

// Redirect if not logged in
if (!api.token) {
    window.location.href = './index.html';
}

let memberProfile = null;

// Load member profile and display info
async function loadDashboard() {
    try {
        const response = await api.getProfile();
        memberProfile = response.data.customer;

        // Update member info
        document.getElementById('memberName').textContent = memberProfile.name;
        document.getElementById('memberId').textContent = memberProfile.memberId;
        document.getElementById('planType').textContent = memberProfile.plan;

        // Update member avatar with photo if available
        const avatarDiv = document.querySelector('.member-avatar');
        if (memberProfile.photo) {
            avatarDiv.innerHTML = `<img src="${memberProfile.photo}" alt="${memberProfile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarDiv.innerHTML = '👤';
        }

        // Calculate and display days remaining
        const status = calculateMembershipStatus(memberProfile.validity);
        document.getElementById('daysRemaining').textContent = status.daysRemaining;
        document.getElementById('expiryDate').textContent = new Date(memberProfile.validity).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        // Update status badge and card
        const badge = document.getElementById('statusBadge');
        const card = document.getElementById('statusCard');
        badge.textContent = status.text;
        badge.className = `status-badge status-${status.class}`;
        card.className = `status-card card-${status.class}`;

        // Check if first login - show password change modal
        if (sessionStorage.getItem('isFirstLogin') === 'true') {
            showPasswordChangeModal();
        }
    } catch (error) {
        alert('Failed to load profile: ' + error.message);
    }
}

function calculateMembershipStatus(validity) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validityDate = new Date(validity);
    validityDate.setHours(0, 0, 0, 0);

    const diffTime = validityDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { daysRemaining: 0, text: 'Expired', class: 'expired' };
    } else if (diffDays <= 7) {
        return { daysRemaining: diffDays, text: 'Expiring Soon', class: 'expiring' };
    } else {
        return { daysRemaining: diffDays, text: 'Active', class: 'active' };
    }
}

function showPasswordChangeModal() {
    document.getElementById('passwordModal').style.display = 'flex';
}

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        api.clearToken();
        sessionStorage.clear();
        window.location.href = './index.html';
    }
});

// Handle password change form
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;
    const errorDiv = document.getElementById('pwdError');

    errorDiv.style.display = 'none';

    if (newPwd !== confirmPwd) {
        errorDiv.textContent = 'Passwords do not match!';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPwd.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        await api.changePassword(currentPwd, newPwd);
        sessionStorage.removeItem('isFirstLogin');
        document.getElementById('passwordModal').style.display = 'none';
        alert('Password changed successfully!');
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
});

// Initialize dashboard
loadDashboard();
