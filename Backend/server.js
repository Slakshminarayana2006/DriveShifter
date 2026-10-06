require('dotenv').config();

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const express = require('express');
const cors = require('cors');
const app = express();
const Path = require('path');
const cookieParser = require('cookie-parser');
const prisma = require('./config/prisma');
const authRoutes = require('./routes/auth.route');
const driveRoutes = require('./routes/drive.route');
const transferRoutes = require('./routes/transfer.route');
const dashboardRoutes = require('./routes/dashboard.route')


app.use(cors(
    {
        origin : "https://drive-shifter.vercel.app/",
        credentials : true
    }
));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(Path.join('__dirname + public')));

app.get('/', (req, res) => {
    res.send("Express Server running.......");
});

app.use('/api/auth', authRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);


const PORT = process.env.PORT || 4000;

const dbserver = async () => {
    prisma.$connect()
    .then(() => {
        console.log('postgresql is connect');
        app.listen(PORT, () => {
            console.log(`Express Running at ${PORT}`);
        })
    })
    .catch((e) => {
        console.log(e.message);             
    })
}

dbserver();



