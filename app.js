console.log("UPDATED CHECKOUT APP LOADED");

const API_URL =
    "https://cst3144-after-school-backend-m01018927.onrender.com";

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
            loadError: "",
            isSubmitting: false,
            submittedOrderId: ""
        };
    },

    created() {
        this.fetchLessons();
    },

    computed: {
        sortedLessons() {
            const attribute = this.sortBy;
            const direction =
                this.sortOrder === "ascending" ? 1 : -1;

            return [...this.lessons].sort(function(a, b) {
                if (typeof a[attribute] === "string") {
                    return a[attribute].localeCompare(
                        b[attribute]
                    ) * direction;
                }

                return (a[attribute] - b[attribute]) * direction;
            });
        },

        validName() {
            return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(
                this.customerName.trim()
            );
        },

        validPhone() {
            return /^[0-9]+$/.test(this.customerPhone);
        },

        canCheckout() {
            return this.validName &&
                this.validPhone &&
                this.cart.length > 0 &&
                !this.isSubmitting &&
                this.submittedOrderId === "";
        }
    },

    methods: {
        lessonImageUrl(imagePath) {
        return API_URL + imagePath;
    },
        fetchLessons() {
            this.loading = true;
            this.loadError = "";

            return fetch(API_URL + "/lessons")
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error("Could not load lessons.");
                    }

                    return response.json();
                })
                .then((data) => {
                    if (!Array.isArray(data)) {
                        throw new Error(
                            "The API did not return a lesson array."
                        );
                    }

                    this.lessons = data;
                })
                .catch((error) => {
                    this.loadError =
                        "Unable to load lessons. Check the backend connection.";

                    console.error(error);
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        addToCart(lesson) {
            if (this.isSubmitting || this.submittedOrderId !== "") {
                return;
            }

            if (lesson.spaces > 0) {
                this.orderMessage = "";
                this.cart.push(lesson.id);
                lesson.spaces--;
            }
        },

        toggleCart() {
            this.showLessons = !this.showLessons;
        },

        getLesson(lessonId) {
            return this.lessons.find(function(lesson) {
                return lesson.id === lessonId;
            });
        },

        removeFromCart(index) {
            if (this.isSubmitting || this.submittedOrderId !== "") {
                return;
            }

            if (index < 0 || index >= this.cart.length) {
                return;
            }

            const lessonId = this.cart[index];
            const lesson = this.getLesson(lessonId);

            if (lesson) {
                lesson.spaces++;
                this.cart.splice(index, 1);
            }
        },

        async completeSavedOrder() {
    if (this.submittedOrderId === "") {
        return;
    }

    this.isSubmitting = true;

    const orderId = this.submittedOrderId;

    try {
        // Update each different lesson only once.
        const lessonIds = [...new Set(this.cart)];

        for (const lessonId of lessonIds) {
            const lesson = this.getLesson(lessonId);

            const response = await fetch(
                API_URL + "/lessons/" + lessonId,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        space: lesson.spaces
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Unable to update lesson spaces."
                );
            }
        }

        // Clear the cart only after every update succeeds.
        this.cart = [];
        this.customerName = "";
        this.customerPhone = "";
        this.submittedOrderId = "";

        this.orderMessage =
            "Order completed successfully! Reference: " + orderId;
    } catch (error) {
        this.orderMessage =
            "Order " + orderId +
            " was saved, but availability updates are incomplete. " +
            "Click Retry Availability Update.";

        console.error("Availability update error:", error);
    } finally {
        this.isSubmitting = false;
    }
},

        async checkout() {
            if (!this.canCheckout) {
                return;
            }

            this.isSubmitting = true;
            this.orderMessage = "";

            // Combine repeated lesson IDs into quantities.
            const items = [];

            this.cart.forEach(function(lessonId) {
                const existingItem = items.find(function(item) {
                    return item.lessonId === lessonId;
                });

                if (existingItem) {
                    existingItem.spaces++;
                } else {
                    items.push({
                        lessonId: lessonId,
                        spaces: 1
                    });
                }
            });

            const order = {
                name: this.customerName.trim(),
                phone: this.customerPhone,
                items: items
            };

            try {
                const response = await fetch(API_URL + "/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(order)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Unable to submit order."
                    );
                }

                this.submittedOrderId = result.orderId;

                await this.completeSavedOrder();

            } catch (error) {
                this.orderMessage = error.message;
                console.error("Checkout error:", error);
            } finally {
                this.isSubmitting = false;
            }
        }
    }
});

myApp.mount("#app");