require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const path = require('path');

// Importar modelos
const User = require(path.join(__dirname, '../models/User'));
const Profile = require(path.join(__dirname, '../models/Profile'));

async function checkProfile() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Buscar todos os usuários
    const users = await User.find().select('name email');
    console.log(`\nEncontrados ${users.length} usuários:`);
    
    for (const user of users) {
      console.log(`- ${user.name} (${user.email})`);
      
      // Buscar perfil do usuário
      const profile = await Profile.findOne({ userId: user._id });
      if (profile) {
        console.log(`  ✅ Perfil encontrado: ${profile.firstName} ${profile.lastName} (slug: ${profile.slug})`);
      } else {
        console.log(`  ❌ Perfil não encontrado`);
      }
    }

    // Buscar todos os perfis
    const profiles = await Profile.find().populate('userId', 'name email');
    console.log(`\nEncontrados ${profiles.length} perfis:`);
    
    for (const profile of profiles) {
      console.log(`- ${profile.firstName} ${profile.lastName} (slug: ${profile.slug})`);
      console.log(`  Usuário: ${profile.userId?.name} (${profile.userId?.email})`);
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado do MongoDB');
  }
}

checkProfile();
