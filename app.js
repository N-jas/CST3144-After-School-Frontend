const myApp = Vue.createApp({
    data() {
        return {
            sitename: "After School Activities",
            showLessons: true,
            cart: [],
            sortBy: "subject",
            sortOrder: "ascending",
            customerName: "",
            customerPhone: "",
            orderMessage: "",
            lessons: [],
            loading: true,
            loadError: ""  
        };
    },

    created() {
        this.fetchLessons();
    },

    computed: {
        sortedLessons() {
            const attribute = this.sortBy;
            const direction = this.sortOrder === "ascending" ? 1 : -1;

            return [...this.lessons].sort(function(a, b) {
                if (typeof a[attribute] === "string") {
                    return a[attribute].localeCompare(b[attribute]) * direction;
                }

                return (a[attribute] - b[attribute]) * direction;
            });
        }
    },

    validName() {
        return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(this.customerName.trim());
    },

    validPhone() {
        return /^[0-9]+$/.test(this.customerPhone);
    },

    canCheckout() {
        return this.validName && this.validPhone && this.cart.length > 0;
    },

    methods: {
        fetchLessons() {
        this.loading = true;
        this.loadError = "";

        return fetch("http://localhost:3000/lessons")
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error("Could not load lessons.");
                    }

                    return response.json();
                })
                .then((data) => {
                    this.lessons = data;
                })
                .catch((error) => {
                    this.loadError ="Unable to load lessons. Check that the backend is running.";

                    console.error(error);
                })
                .finally(() => {
                    this.loading = false;
                });
        },
    
        addToCart(lesson) {
            if (lesson.spaces > 0) {
                this.orderMessage = "";
                this.cart.push(lesson.id);
                lesson.spaces--;
            }
        },

        toggleCart(){
            this.showLessons = !this.showLessons;
        },

        getLesson(lessonId){
            return this.lessons.find(function(lesson) {
                return lesson.id === lessonId;
            });
        },

        removeFromCart(index){
            const lessonId = this.cart[index];
            const lesson = this.getLesson(lessonId);

            lesson.spaces++;
            this.cart.splice(index, 1);
        },

        checkout() {
            if (!this.canCheckout) {
                return;
            }

            this.orderMessage =
                "Thank you, " + this.customerName.trim() +
                "! Your order has been confirmed in this demo.";

            this.cart = [];
            this.customerName = "";
            this.customerPhone = "";
        }
    }
});

myApp.mount("#app");